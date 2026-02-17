const { pool } = require('./db');

async function createCliente(data) {
  const result = await pool.query(
    'INSERT INTO clientes (nome, email, cpf, rg, renda_mensal, tipo_trabalho) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [data.nome, data.email, data.cpf, data.rg, data.renda_mensal, data.tipo_trabalho]
  );
  return result.rows[0];
}

async function listClientes() {
  const result = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
  return result.rows;
}

async function findClienteById(id) {
  const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
  return result.rows[0];
}

async function updateCliente(id, data) {
  const result = await pool.query(
    'UPDATE clientes SET nome = $1, email = $2, cpf = $3, rg = $4, renda_mensal = $5, tipo_trabalho = $6 WHERE id = $7 RETURNING *',
    [data.nome, data.email, data.cpf, data.rg, data.renda_mensal, data.tipo_trabalho, id]
  );
  return result.rows[0];
}

async function deleteCliente(id) {
  const result = await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = { createCliente, listClientes, findClienteById, updateCliente, deleteCliente };
