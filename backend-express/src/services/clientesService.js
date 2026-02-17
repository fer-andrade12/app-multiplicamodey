const clientesRepository = require('../repositories/clientesRepository');
const enderecosRepository = require('../repositories/enderecosRepository');
const { toCliente } = require('../entities/cliente');
const { toEndereco } = require('../entities/endereco');

function normalizarCep(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 8);
}

function normalizarTexto(value) {
  return String(value || '').trim();
}

function normalizarEmail(value) {
  return normalizarTexto(value).toLowerCase();
}

function apenasDigitos(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizarTipoTrabalho(value) {
  return normalizarTexto(value).toUpperCase();
}

function normalizarTipoEndereco(value) {
  return normalizarTexto(value).toUpperCase();
}

function normalizarEstado(value) {
  return normalizarTexto(value).toUpperCase().slice(0, 2);
}

function normalizarClientePayload(data = {}) {
  return {
    nome: normalizarTexto(data.nome),
    email: normalizarEmail(data.email),
    cpf: apenasDigitos(data.cpf),
    rg: apenasDigitos(data.rg),
    renda_mensal: Number(data.renda_mensal),
    tipo_trabalho: normalizarTipoTrabalho(data.tipo_trabalho),
  };
}

function normalizarEnderecoPayload(data = {}) {
  return {
    ...data,
    cep: normalizarCep(data.cep),
    logradouro: normalizarTexto(data.logradouro),
    numero: normalizarTexto(data.numero),
    complemento: normalizarTexto(data.complemento),
    bairro: normalizarTexto(data.bairro),
    cidade: normalizarTexto(data.cidade),
    estado: normalizarEstado(data.estado),
    tipo: normalizarTipoEndereco(data.tipo),
  };
}

async function createCliente(data) {
  const row = await clientesRepository.createCliente(normalizarClientePayload(data));
  return toCliente(row);
}

async function listClientes() {
  const rows = await clientesRepository.listClientes();
  return rows.map(toCliente);
}

async function getCliente(id) {
  const row = await clientesRepository.findClienteById(id);
  return toCliente(row);
}

async function updateCliente(id, data) {
  const cliente = await clientesRepository.findClienteById(id);
  if (!cliente) return null;

  const payload = normalizarClientePayload(data);

  const row = await clientesRepository.updateCliente(id, {
    nome: payload.nome,
    email: payload.email,
    cpf: payload.cpf,
    rg: payload.rg,
    renda_mensal: payload.renda_mensal,
    tipo_trabalho: payload.tipo_trabalho,
  });

  return toCliente(row);
}

async function excluirCliente(id) {
  const cliente = await clientesRepository.findClienteById(id);
  if (!cliente) return false;
  return clientesRepository.deleteCliente(id);
}

async function adicionarEndereco(clienteId, data) {
  const cliente = await clientesRepository.findClienteById(clienteId);
  if (!cliente) return null;

  const payload = normalizarEnderecoPayload(data);
  const cepNormalizado = payload.cep;
  const existente = await enderecosRepository.findEnderecoByClienteCep(clienteId, cepNormalizado);
  if (existente) {
    return { ok: false, duplicatedCep: true };
  }

  const row = await enderecosRepository.createEndereco(clienteId, {
    ...payload,
    cep: cepNormalizado,
  });
  return toEndereco(row);
}

async function listarEnderecos(clienteId) {
  const rows = await enderecosRepository.listEnderecosByCliente(clienteId);
  return rows.map(toEndereco);
}

async function excluirEndereco(clienteId, enderecoId) {
  const cliente = await clientesRepository.findClienteById(clienteId);
  if (!cliente) return { ok: false, notFoundCliente: true };

  const deleted = await enderecosRepository.deleteEndereco(clienteId, enderecoId);
  if (!deleted) return { ok: false, notFoundEndereco: true };

  return { ok: true };
}

module.exports = {
  createCliente,
  listClientes,
  getCliente,
  updateCliente,
  excluirCliente,
  adicionarEndereco,
  listarEnderecos,
  excluirEndereco,
};
