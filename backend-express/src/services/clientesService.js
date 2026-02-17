const clientesRepository = require('../repositories/clientesRepository');
const enderecosRepository = require('../repositories/enderecosRepository');
const { toCliente } = require('../entities/cliente');
const { toEndereco } = require('../entities/endereco');

function normalizarCep(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 8);
}

async function createCliente(data) {
  const row = await clientesRepository.createCliente(data);
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

  const row = await clientesRepository.updateCliente(id, {
    nome: data.nome,
    email: data.email,
    cpf: data.cpf,
    rg: data.rg,
    renda_mensal: data.renda_mensal,
    tipo_trabalho: data.tipo_trabalho,
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

  const cepNormalizado = normalizarCep(data.cep);
  const existente = await enderecosRepository.findEnderecoByClienteCep(clienteId, cepNormalizado);
  if (existente) {
    return { ok: false, duplicatedCep: true };
  }

  const row = await enderecosRepository.createEndereco(clienteId, {
    ...data,
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
