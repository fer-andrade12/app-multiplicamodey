const { pool } = require('./db');

async function createInvestimentoTx(client, clienteId, data) {
  const result = await client.query(
    'INSERT INTO investimentos (cliente_id, valor_principal, taxa_juros, tipo_juros, quantidade_parcelas, valor_juros, valor_total, valor_parcela, saldo_devedor, status, data_inicio) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW()) RETURNING *',
    [
      clienteId,
      data.valor_principal,
      data.taxa_juros,
      data.tipo_juros,
      data.quantidade_parcelas,
      data.valor_juros,
      data.valor_total,
      data.valor_parcela,
      data.saldo_devedor,
      data.status,
    ]
  );
  return result.rows[0];
}

async function listInvestimentosByCliente(clienteId) {
  const result = await pool.query(
    'SELECT i.*, c.nome AS cliente_nome, c.cpf AS cliente_cpf FROM investimentos i JOIN clientes c ON c.id = i.cliente_id WHERE i.cliente_id = $1 ORDER BY i.id DESC',
    [clienteId]
  );
  return result.rows;
}

async function listInvestimentos() {
  const result = await pool.query(
    'SELECT i.*, c.nome AS cliente_nome, c.cpf AS cliente_cpf FROM investimentos i JOIN clientes c ON c.id = i.cliente_id ORDER BY i.id DESC'
  );
  return result.rows;
}

async function findInvestimentoById(id) {
  const result = await pool.query('SELECT * FROM investimentos WHERE id = $1', [id]);
  return result.rows[0];
}

async function updateInvestimentoSaldo(client, investimentoId, saldo, status) {
  await client.query('UPDATE investimentos SET saldo_devedor = $1, status = $2 WHERE id = $3', [saldo, status, investimentoId]);
}

async function updateInvestimentoProrrogacao(client, investimentoId, saldo, meses, taxa, status, valorParcela) {
  const result = await client.query(
    'UPDATE investimentos SET saldo_devedor = $1, quantidade_parcelas = quantidade_parcelas + $2, taxa_juros = $3, status = $4, valor_parcela = $5 WHERE id = $6 RETURNING *',
    [saldo, meses, taxa, status, valorParcela, investimentoId]
  );
  return result.rows[0];
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createInvestimentoTx,
  listInvestimentos,
  listInvestimentosByCliente,
  findInvestimentoById,
  updateInvestimentoSaldo,
  updateInvestimentoProrrogacao,
  withTransaction,
};
