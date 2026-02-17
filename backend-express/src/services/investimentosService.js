const clientesRepository = require('../repositories/clientesRepository');
const investimentosRepository = require('../repositories/investimentosRepository');
const pagamentosRepository = require('../repositories/pagamentosRepository');
const prorrogacoesRepository = require('../repositories/prorrogacoesRepository');
const { toInvestimento } = require('../entities/investimento');
const { toPagamento } = require('../entities/pagamento');
const { toProrrogacao } = require('../entities/prorrogacao');
const { toParcela } = require('../entities/parcela');
const parcelasRepository = require('../repositories/parcelasRepository');
const {
  jurosSimples,
  jurosCompostos,
  jurosPrice,
  totalPrice,
  parcelaPrice,
  validarTaxa,
  validarParcela,
  riscoPorRenda,
} = require('./calculadoraService');

function calcularTotal(data) {
  const taxa = Number(data.taxa_juros);
  const parcelas = Number(data.quantidade_parcelas);
  const principal = Number(data.valor_principal);
  const isPrice = String(data.tipo_juros).toUpperCase() === 'COMPOSTO';

  const valorJuros = isPrice
    ? jurosPrice(principal, taxa, parcelas)
    : jurosSimples(principal, taxa, parcelas);

  const valorTotal = isPrice
    ? totalPrice(principal, taxa, parcelas)
    : principal + valorJuros;

  const valorParcela = isPrice
    ? parcelaPrice(principal, taxa, parcelas)
    : valorTotal / parcelas;

  return {
    valor_juros: Number(valorJuros),
    valor_total: Number(valorTotal),
    valor_parcela: Number(valorParcela),
  };
}

function gerarParcelas(quantidadeParcelas, valorParcela) {
  const lista = [];
  const now = new Date();

  for (let i = 1; i <= quantidadeParcelas; i += 1) {
    const vencimento = new Date(now);
    vencimento.setMonth(vencimento.getMonth() + i);
    lista.push({
      numero: i,
      valor: Number(valorParcela),
      vencimento,
      status: 'PENDENTE',
    });
  }

  return lista;
}

function addDays(baseDate, dias) {
  const data = new Date(baseDate);
  data.setDate(data.getDate() + Number(dias));
  return data;
}

function diffDaysUntilDue(vencimento, referenceDate = new Date()) {
  const due = new Date(vencimento);
  if (Number.isNaN(due.getTime())) return null;

  const ref = new Date(referenceDate);
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const refStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((dueStart - refStart) / msPerDay);
}

async function createInvestimento(clienteId, data) {
  const cliente = await clientesRepository.findClienteById(clienteId);
  if (!cliente) return { ok: false, error: 'Cliente nao encontrado' };

  const totals = calcularTotal(data);
  if (!validarTaxa(data.taxa_juros)) {
    return { ok: false, error: 'Taxa acima do limite de 20% ao mes' };
  }
  if (!validarParcela(totals.valor_parcela, cliente.renda_mensal)) {
    return { ok: false, error: 'Parcela acima de 40% da renda' };
  }

  return investimentosRepository.withTransaction(async (client) => {
    const row = await investimentosRepository.createInvestimentoTx(client, clienteId, {
      ...data,
      ...totals,
      saldo_devedor: totals.valor_total,
      status: 'ATIVO',
    });

    const parcelas = gerarParcelas(Number(data.quantidade_parcelas), totals.valor_parcela);
    const parcelasRows = await parcelasRepository.createParcelas(client, row.id, parcelas);

    return {
      investimento: toInvestimento(row),
      parcelas: parcelasRows.map(toParcela),
      risco: riscoPorRenda(Number(cliente.renda_mensal)),
    };
  });
}

async function listInvestimentosByCliente(clienteId) {
  const rows = await investimentosRepository.listInvestimentosByCliente(clienteId);
  return rows.map(toInvestimento);
}

async function listInvestimentos() {
  const rows = await investimentosRepository.listInvestimentos();
  return rows.map(toInvestimento);
}

async function getInvestimento(id) {
  const row = await investimentosRepository.findInvestimentoById(id);
  return toInvestimento(row);
}

async function listParcelasInvestimento(investimentoId) {
  const rows = await parcelasRepository.listByInvestimento(investimentoId);
  return rows.map(toParcela);
}

async function registrarPagamento(investimentoId, valor, parcelaNumero) {
  return investimentosRepository.withTransaction(async (client) => {
    const investimento = await pagamentosRepository.lockInvestimento(client, investimentoId);
    if (!investimento) return null;

    const proximaParcela = await parcelasRepository.findProximaPendente(client, investimentoId);
    if (!proximaParcela) {
      return { ok: false, error: 'Nenhuma parcela em aberto para pagamento.' };
    }

    const numeroInformado = parcelaNumero == null ? null : Number(parcelaNumero);
    if (numeroInformado != null && Number.isFinite(numeroInformado) && numeroInformado !== Number(proximaParcela.numero)) {
      return {
        ok: false,
        error: `A proxima parcela em aberto e a #${proximaParcela.numero}.`,
        proxima_parcela: toParcela(proximaParcela),
      };
    }

    let novoSaldo = Number(investimento.saldo_devedor) - Number(valor);
    let status = investimento.status;
    if (novoSaldo <= 0) {
      novoSaldo = 0;
      status = 'QUITADO';
    }

    const pagamento = await pagamentosRepository.createPagamento(client, investimentoId, valor);
    await investimentosRepository.updateInvestimentoSaldo(client, investimentoId, novoSaldo, status);

    if (novoSaldo === 0) {
      await parcelasRepository.marcarPendentesPagas(client, investimentoId);
    } else {
      await parcelasRepository.marcarParcelaPaga(client, proximaParcela.id);
    }

    return {
      pagamento: toPagamento(pagamento),
      parcela_paga: toParcela(proximaParcela),
      saldo_devedor: Number(novoSaldo),
      status,
    };
  });
}

async function prorrogar(investimentoId, mesesAdicionados, novaTaxa) {
  return investimentosRepository.withTransaction(async (client) => {
    const investimento = await prorrogacoesRepository.lockInvestimento(client, investimentoId);
    if (!investimento) return null;

    const taxa = novaTaxa != null ? Number(novaTaxa) : Number(investimento.taxa_juros);
    if (!validarTaxa(taxa)) {
      return { ok: false, error: 'Taxa acima do limite de 20% ao mes' };
    }

    const juros = jurosCompostos(Number(investimento.saldo_devedor), taxa, Number(mesesAdicionados));
    const novoSaldo = Number(investimento.saldo_devedor) + juros;
    const novaQuantidade = Number(investimento.quantidade_parcelas) + Number(mesesAdicionados);
    const novoValorParcela = novaQuantidade > 0 ? novoSaldo / novaQuantidade : novoSaldo;

    const prorrogacao = await prorrogacoesRepository.createProrrogacao(
      client,
      investimentoId,
      Number(mesesAdicionados),
      taxa
    );

    const updated = await investimentosRepository.updateInvestimentoProrrogacao(
      client,
      investimentoId,
      novoSaldo,
      Number(mesesAdicionados),
      taxa,
      'PRORROGADO',
      Number(novoValorParcela)
    );

    const novasParcelas = gerarParcelas(Number(mesesAdicionados), novoValorParcela);
    if (novasParcelas.length) {
      await parcelasRepository.createParcelas(client, investimentoId, novasParcelas);
    }

    return { investimento: toInvestimento(updated), prorrogacao: toProrrogacao(prorrogacao) };
  });
}

async function prorrogarParcela(investimentoId, parcelaNumero, diasProrrogados, taxaJurosDia = 0.02) {
  return investimentosRepository.withTransaction(async (client) => {
    const investimento = await pagamentosRepository.lockInvestimento(client, investimentoId);
    if (!investimento) return null;

    const parcela = await parcelasRepository.findParcelaByNumeroForUpdate(
      client,
      investimentoId,
      parcelaNumero
    );

    if (!parcela) {
      return { ok: false, error: `Parcela #${parcelaNumero} nao encontrada para este investimento.` };
    }

    if (String(parcela.status).toUpperCase() !== 'PENDENTE') {
      return { ok: false, error: `Parcela #${parcelaNumero} nao esta em aberto para prorrogacao.` };
    }

    const dias = Number(diasProrrogados);
    if (!Number.isFinite(dias) || dias <= 0) {
      return { ok: false, error: 'Dias para prorrogacao devem ser maiores que zero.' };
    }

    const taxaDia = Number(taxaJurosDia);
    if (!Number.isFinite(taxaDia) || taxaDia <= 0) {
      return { ok: false, error: 'Taxa diaria invalida para prorrogacao.' };
    }

    const diasAteVencimento = diffDaysUntilDue(parcela.vencimento);
    if (diasAteVencimento == null) {
      return { ok: false, error: 'Data de vencimento invalida para prorrogacao.' };
    }

    if (diasAteVencimento >= 20) {
      return {
        ok: false,
        error: `Prorrogacao permitida apenas quando faltarem menos de 20 dias para o vencimento da parcela #${parcelaNumero}.`,
        dias_ate_vencimento: diasAteVencimento,
      };
    }

    const valorAtual = Number(parcela.valor);
    const acrescimo = valorAtual * taxaDia * dias;
    const novoValor = valorAtual + acrescimo;
    const novoVencimento = addDays(parcela.vencimento, dias);

    const parcelaAtualizada = await parcelasRepository.updateParcelaProrrogacao(
      client,
      parcela.id,
      novoValor,
      novoVencimento
    );

    const saldoAtual = Number(investimento.saldo_devedor);
    const novoSaldo = saldoAtual + acrescimo;

    await investimentosRepository.updateInvestimentoSaldo(
      client,
      investimentoId,
      novoSaldo,
      investimento.status
    );

    return {
      ok: true,
      investimento_id: Number(investimentoId),
      parcela: toParcela(parcelaAtualizada),
      dias_prorrogados: dias,
      taxa_juros_dia: taxaDia,
      valor_acrescimo: Number(acrescimo),
      novo_saldo_devedor: Number(novoSaldo),
    };
  });
}

module.exports = {
  createInvestimento,
  listInvestimentos,
  listInvestimentosByCliente,
  getInvestimento,
  listParcelasInvestimento,
  registrarPagamento,
  prorrogar,
  prorrogarParcela,
  calcularTotal,
};
