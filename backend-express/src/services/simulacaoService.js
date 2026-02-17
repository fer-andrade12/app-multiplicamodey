const clientesRepository = require('../repositories/clientesRepository');
const {
  jurosSimples,
  jurosPrice,
  totalPrice,
  parcelaPrice,
  riscoPorRenda,
  validarTaxa,
  validarParcela,
} = require('./calculadoraService');

function calcularSimulacao({ valor_principal, taxa_juros, quantidade_parcelas, tipo_juros }) {
  const principal = Number(valor_principal);
  const taxa = Number(taxa_juros);
  const quantidade = Number(quantidade_parcelas);

  const isPrice = String(tipo_juros).toUpperCase() === 'COMPOSTO';

  const juros = isPrice
    ? jurosPrice(principal, taxa, quantidade)
    : jurosSimples(principal, taxa, quantidade);

  const total = isPrice
    ? totalPrice(principal, taxa, quantidade)
    : principal + juros;

  const valorParcela = isPrice
    ? parcelaPrice(principal, taxa, quantidade)
    : total / quantidade;

  return { total, juros, valorParcela };
}

function round2(value) {
  return Number(Number(value).toFixed(2));
}

function formatDateISO(value) {
  return value.toISOString().slice(0, 10);
}

function formatDateTimeISO(value) {
  return value.toISOString();
}

function addMonthsSafe(baseDate, monthsToAdd) {
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();

  const targetMonthIndex = month + monthsToAdd;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDayOfTargetMonth);

  return new Date(Date.UTC(targetYear, targetMonth, targetDay));
}

function gerarParcelasDetalhadas({ principal, taxa, quantidadeParcelas, tipoJuros, valorParcela, dataSimulacao }) {
  const parcelasDetalhadas = [];
  let saldo = Number(principal);
  const isPrice = String(tipoJuros).toUpperCase() === 'COMPOSTO';
  const dataBase = dataSimulacao || new Date();

  for (let numero = 1; numero <= Number(quantidadeParcelas); numero += 1) {
    const jurosMes = isPrice ? saldo * Number(taxa) : Number(principal) * Number(taxa);
    let amortizacao = isPrice
      ? Number(valorParcela) - jurosMes
      : Number(principal) / Number(quantidadeParcelas);

    if (numero === Number(quantidadeParcelas)) {
      amortizacao = saldo;
    }

    const valorParcelaMes = numero === Number(quantidadeParcelas)
      ? jurosMes + amortizacao
      : Number(valorParcela);

    saldo = Math.max(0, saldo - amortizacao);
    const dataVencimento = addMonthsSafe(dataBase, numero);

    parcelasDetalhadas.push({
      numero,
      data_vencimento: formatDateISO(dataVencimento),
      valor_parcela: round2(valorParcelaMes),
      valor_juros: round2(jurosMes),
      valor_amortizacao: round2(amortizacao),
      saldo_restante: round2(saldo),
    });
  }

  return parcelasDetalhadas;
}

async function simular(clienteId, payload) {
  const cliente = await clientesRepository.findClienteById(clienteId);
  if (!cliente) return { ok: false, error: 'Cliente nao encontrado' };

  const dataSimulacao = new Date();

  const { total, juros, valorParcela } = calcularSimulacao(payload);
  const rendaMensal = Number(cliente.renda_mensal);

  const regras = {
    taxa_ok: validarTaxa(payload.taxa_juros),
    parcela_ok: validarParcela(valorParcela, rendaMensal),
  };

  if (!regras.taxa_ok) {
    return { ok: false, error: 'Taxa acima do limite de 20% ao mes', regras };
  }

  if (!regras.parcela_ok) {
    return { ok: false, error: 'Parcela acima de 40% da renda', regras };
  }

  const parcelasDetalhadas = gerarParcelasDetalhadas({
    principal: Number(payload.valor_principal),
    taxa: Number(payload.taxa_juros),
    quantidadeParcelas: Number(payload.quantidade_parcelas),
    tipoJuros: payload.tipo_juros,
    valorParcela,
    dataSimulacao,
  });

  return {
    ok: true,
    cliente_id: Number(clienteId),
    risco: riscoPorRenda(rendaMensal),
    valor_principal: Number(payload.valor_principal),
    taxa_juros: Number(payload.taxa_juros),
    quantidade_parcelas: Number(payload.quantidade_parcelas),
    tipo_juros: payload.tipo_juros,
    data_simulacao: formatDateTimeISO(dataSimulacao),
    valor_total: Number(total),
    valor_juros: Number(juros),
    valor_parcela: Number(valorParcela),
    parcelas_detalhadas: parcelasDetalhadas,
    regras,
  };
}

module.exports = { simular, calcularSimulacao };
