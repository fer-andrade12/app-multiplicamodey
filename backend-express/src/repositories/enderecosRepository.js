const { pool } = require('./db');

async function createEndereco(clienteId, data) {
  const result = await pool.query(
    'INSERT INTO enderecos (cliente_id, cep, logradouro, numero, complemento, bairro, cidade, estado, tipo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
    [clienteId, data.cep, data.logradouro, data.numero, data.complemento || null, data.bairro, data.cidade, data.estado, data.tipo]
  );
  return result.rows[0];
}

async function listEnderecosByCliente(clienteId) {
  const result = await pool.query('SELECT * FROM enderecos WHERE cliente_id = $1 ORDER BY id DESC', [clienteId]);
  return result.rows;
}

async function findEnderecoByClienteCep(clienteId, cep) {
  const result = await pool.query('SELECT * FROM enderecos WHERE cliente_id = $1 AND cep = $2 LIMIT 1', [clienteId, cep]);
  return result.rows[0] || null;
}

async function deleteEndereco(clienteId, enderecoId) {
  const result = await pool.query('DELETE FROM enderecos WHERE cliente_id = $1 AND id = $2', [clienteId, enderecoId]);
  return result.rowCount > 0;
}

module.exports = { createEndereco, listEnderecosByCliente, findEnderecoByClienteCep, deleteEndereco };
