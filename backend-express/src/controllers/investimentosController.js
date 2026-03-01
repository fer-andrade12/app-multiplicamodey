const express = require('express');
const investimentosService = require('../services/investimentosService');

const byCliente = express.Router({ mergeParams: true });
const investimentoCrud = express.Router();

function isAdmin(req) {
  return String(req.user?.role || '').toUpperCase() === 'ADMIN';
}

function isUsuario(req) {
  return String(req.user?.role || '').toUpperCase() === 'USUARIO';
}

function usuarioClienteId(req) {
  const id = Number(req.user?.cliente_id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

investimentoCrud.get('/', async (req, res) => {
  try {
    const investimentos = isUsuario(req)
      ? await investimentosService.listInvestimentosByCliente(usuarioClienteId(req))
      : await investimentosService.listInvestimentos();
    res.json(investimentos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

investimentoCrud.post('/', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Apenas ADMIN pode criar investimentos.' });
  }

  const clienteId = parseId(req.body.codicoCliente ?? req.body.codigoCliente);
  if (!clienteId) return res.status(400).json({ error: 'ID invalido' });

  const { valor_principal, taxa_juros, tipo_juros, quantidade_parcelas } = req.body;
  if (valor_principal == null || taxa_juros == null || !tipo_juros || quantidade_parcelas == null) {
    return res.status(400).json({ error: 'Campos obrigatorios faltando' });
  }

  try {
    const result = await investimentosService.createInvestimento(clienteId, {
      valor_principal,
      taxa_juros,
      tipo_juros,
      quantidade_parcelas,
    });
    if (!result) return res.status(404).json({ error: 'Cliente nao encontrado' });
    if (result.ok === false) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

byCliente.get('/', async (req, res) => {
  const clienteId = parseId(req.params.codigoCliente);
  if (!clienteId) return res.status(400).json({ error: 'ID invalido' });

  if (isUsuario(req) && clienteId !== usuarioClienteId(req)) {
    return res.status(403).json({ error: 'USUARIO so pode visualizar os proprios investimentos.' });
  }

  try {
    const investimentos = await investimentosService.listInvestimentosByCliente(clienteId);
    res.json(investimentos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

investimentoCrud.get('/:codigoInvestimento', async (req, res) => {
  const investimentoId = parseId(req.params.codigoInvestimento);
  if (!investimentoId) return res.status(400).json({ error: 'ID invalido' });

  try {
    const investimento = await investimentosService.getInvestimento(investimentoId);
    if (!investimento) return res.status(404).json({ error: 'Investimento nao encontrado' });
    if (isUsuario(req) && Number(investimento.cliente_id) !== usuarioClienteId(req)) {
      return res.status(403).json({ error: 'USUARIO so pode visualizar os proprios investimentos.' });
    }
    res.json(investimento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

investimentoCrud.get('/:codigoInvestimento/parcelas', async (req, res) => {
  const investimentoId = parseId(req.params.codigoInvestimento);
  if (!investimentoId) return res.status(400).json({ error: 'ID invalido' });

  try {
    const investimento = await investimentosService.getInvestimento(investimentoId);
    if (!investimento) return res.status(404).json({ error: 'Investimento nao encontrado' });
    if (isUsuario(req) && Number(investimento.cliente_id) !== usuarioClienteId(req)) {
      return res.status(403).json({ error: 'USUARIO so pode visualizar as proprias parcelas.' });
    }

    const parcelas = await investimentosService.listParcelasInvestimento(investimentoId);
    res.json(parcelas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

investimentoCrud.post('/pagamentos', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Apenas ADMIN pode registrar pagamentos.' });
  }

  const investimentoId = parseId(req.body.codigoInvestimento);
  if (!investimentoId) return res.status(400).json({ error: 'ID invalido' });

  const { valor, parcela_numero } = req.body;
  if (valor == null) return res.status(400).json({ error: 'Valor obrigatorio' });

  try {
    const result = await investimentosService.registrarPagamento(investimentoId, valor, parcela_numero);
    if (!result) return res.status(404).json({ error: 'Investimento nao encontrado' });
    if (result.ok === false) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

investimentoCrud.post('/prorrogacoes', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Apenas ADMIN pode registrar prorrogacoes.' });
  }

  const investimentoId = parseId(req.body.codigoInvestimento);
  if (!investimentoId) return res.status(400).json({ error: 'ID invalido' });

  const { meses_adicionados, nova_taxa } = req.body;
  if (meses_adicionados == null) return res.status(400).json({ error: 'Meses obrigatorio' });

  try {
    const result = await investimentosService.prorrogar(investimentoId, meses_adicionados, nova_taxa);
    if (!result) return res.status(404).json({ error: 'Investimento nao encontrado' });
    if (result.ok === false) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

investimentoCrud.post('/parcelas/prorrogacoes', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Apenas ADMIN pode prorrogar parcelas.' });
  }

  const investimentoId = parseId(req.body.codigoInvestimento);
  if (!investimentoId) return res.status(400).json({ error: 'ID invalido' });

  const parcelaNumero = parseId(req.body.parcela_numero);
  if (!parcelaNumero) return res.status(400).json({ error: 'Parcela invalida' });

  const diasProrrogados = Number(req.body.dias_prorrogados);
  if (!Number.isFinite(diasProrrogados) || diasProrrogados <= 0) {
    return res.status(400).json({ error: 'Dias para prorrogacao invalidos' });
  }

  const taxaJurosDia = req.body.taxa_juros_dia == null ? 0.02 : Number(req.body.taxa_juros_dia);

  try {
    const result = await investimentosService.prorrogarParcela(
      investimentoId,
      parcelaNumero,
      diasProrrogados,
      taxaJurosDia
    );
    if (!result) return res.status(404).json({ error: 'Investimento nao encontrado' });
    if (result.ok === false) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { byCliente, investimentoCrud };
