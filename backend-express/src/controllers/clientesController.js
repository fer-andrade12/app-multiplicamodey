const express = require('express');
const clientesService = require('../services/clientesService');

const router = express.Router();

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizarEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizarTexto(value) {
  return String(value || '').trim();
}

function apenasDigitos(value) {
  return String(value || '').replace(/\D/g, '');
}

function parseValorPositivo(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizarTipoTrabalho(value) {
  const allowed = new Set(['AUTONOMO', 'CLT', 'CNPJ_MEI']);
  const normalized = normalizarTexto(value).toUpperCase();
  return allowed.has(normalized) ? normalized : null;
}

function normalizarTipoEndereco(value) {
  const allowed = new Set(['RESIDENCIAL', 'COMERCIAL']);
  const normalized = normalizarTexto(value).toUpperCase();
  return allowed.has(normalized) ? normalized : null;
}

function normalizarEstado(value) {
  return normalizarTexto(value).toUpperCase().slice(0, 2);
}

function normalizarCep(value) {
  return apenasDigitos(value).slice(0, 8);
}

function validarEmail(value) {
  const email = normalizarEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function tratarErroPersistenciaCliente(err, res) {
  if (err?.code === '23505') {
    return res.status(409).json({ error: 'CPF ou email ja cadastrado.' });
  }
  return res.status(500).json({ error: err.message });
}

router.post('/', async (req, res) => {
  const nome = normalizarTexto(req.body.nome);
  const email = normalizarEmail(req.body.email);
  const cpf = apenasDigitos(req.body.cpf);
  const rg = apenasDigitos(req.body.rg);
  const rendaMensal = parseValorPositivo(req.body.renda_mensal);
  const tipoTrabalho = normalizarTipoTrabalho(req.body.tipo_trabalho);

  if (!nome || !email || !cpf || !rg || rendaMensal == null || !tipoTrabalho) {
    return res.status(400).json({ error: 'Campos obrigatorios faltando' });
  }

  if (!validarEmail(email)) {
    return res.status(400).json({ error: 'Email invalido.' });
  }

  try {
    const cliente = await clientesService.createCliente({
      nome,
      email,
      cpf,
      rg,
      renda_mensal: rendaMensal,
      tipo_trabalho: tipoTrabalho,
    });
    res.status(201).json(cliente);
  } catch (err) {
    tratarErroPersistenciaCliente(err, res);
  }
});

router.get('/', async (req, res) => {
  try {
    const clientes = await clientesService.listClientes();
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:codigoCliente', async (req, res) => {
  const clienteId = parseId(req.params.codigoCliente);
  if (!clienteId) return res.status(400).json({ error: 'ID invalido' });

  try {
    const cliente = await clientesService.getCliente(clienteId);
    if (!cliente) return res.status(404).json({ error: 'Cliente nao encontrado' });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:codigoCliente', async (req, res) => {
  const clienteId = parseId(req.params.codigoCliente);
  if (!clienteId) return res.status(400).json({ error: 'ID invalido' });

  const nome = normalizarTexto(req.body.nome);
  const email = normalizarEmail(req.body.email);
  const cpf = apenasDigitos(req.body.cpf);
  const rg = apenasDigitos(req.body.rg);
  const rendaMensal = parseValorPositivo(req.body.renda_mensal);
  const tipoTrabalho = normalizarTipoTrabalho(req.body.tipo_trabalho);

  if (!nome || !email || !cpf || !rg || rendaMensal == null || !tipoTrabalho) {
    return res.status(400).json({ error: 'Campos obrigatorios faltando' });
  }

  if (!validarEmail(email)) {
    return res.status(400).json({ error: 'Email invalido.' });
  }

  try {
    const cliente = await clientesService.updateCliente(clienteId, {
      nome,
      email,
      cpf,
      rg,
      renda_mensal: rendaMensal,
      tipo_trabalho: tipoTrabalho,
    });

    if (!cliente) return res.status(404).json({ error: 'Cliente nao encontrado' });
    res.json(cliente);
  } catch (err) {
    tratarErroPersistenciaCliente(err, res);
  }
});

router.delete('/:codigoCliente', async (req, res) => {
  const clienteId = parseId(req.params.codigoCliente);
  if (!clienteId) return res.status(400).json({ error: 'ID invalido' });

  try {
    const deleted = await clientesService.excluirCliente(clienteId);
    if (!deleted) return res.status(404).json({ error: 'Cliente nao encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:codigoCliente/enderecos', async (req, res) => {
  const clienteId = parseId(req.params.codigoCliente);
  if (!clienteId) return res.status(400).json({ error: 'ID invalido' });

  const cep = normalizarCep(req.body.cep);
  const logradouro = normalizarTexto(req.body.logradouro);
  const numero = normalizarTexto(req.body.numero);
  const complemento = normalizarTexto(req.body.complemento);
  const bairro = normalizarTexto(req.body.bairro);
  const cidade = normalizarTexto(req.body.cidade);
  const estado = normalizarEstado(req.body.estado);
  const tipo = normalizarTipoEndereco(req.body.tipo);

  if (!cep || !logradouro || !numero || !bairro || !cidade || !estado || !tipo) {
    return res.status(400).json({ error: 'Campos obrigatorios faltando' });
  }

  if (cep.length !== 8) {
    return res.status(400).json({ error: 'CEP invalido.' });
  }

  if (estado.length !== 2) {
    return res.status(400).json({ error: 'Estado invalido.' });
  }

  try {
    const endereco = await clientesService.adicionarEndereco(clienteId, {
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      tipo,
    });
    if (!endereco) return res.status(404).json({ error: 'Cliente nao encontrado' });
    if (endereco.ok === false && endereco.duplicatedCep) {
      return res.status(400).json({ error: 'Ja existe endereco cadastrado com este CEP para este cliente.' });
    }
    res.status(201).json(endereco);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:codigoCliente/enderecos', async (req, res) => {
  const clienteId = parseId(req.params.codigoCliente);
  if (!clienteId) return res.status(400).json({ error: 'ID invalido' });

  try {
    const enderecos = await clientesService.listarEnderecos(clienteId);
    res.json(enderecos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:codigoCliente/enderecos/:codigoEndereco', async (req, res) => {
  const clienteId = parseId(req.params.codigoCliente);
  const enderecoId = parseId(req.params.codigoEndereco);
  if (!clienteId || !enderecoId) return res.status(400).json({ error: 'ID invalido' });

  try {
    const result = await clientesService.excluirEndereco(clienteId, enderecoId);
    if (result.notFoundCliente) return res.status(404).json({ error: 'Cliente nao encontrado' });
    if (result.notFoundEndereco) return res.status(404).json({ error: 'Endereco nao encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
