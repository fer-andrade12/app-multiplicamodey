const { pool } = require('./db');

async function createParcelas(client, investimentoId, parcelas) {
  const values = [];
  const placeholders = [];
  let i = 1;

  parcelas.forEach((p) => {
    values.push(investimentoId, p.numero, p.valor, p.vencimento, p.status);
    placeholders.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3}, $${i + 4})`);
    i += 5;
  });

  const sql = `INSERT INTO parcelas (investimento_id, numero, valor, vencimento, status) VALUES ${placeholders.join(', ')} RETURNING *`;
  const result = await client.query(sql, values);
  return result.rows;
}

async function listPendentes(client, investimentoId) {
  const result = await client.query(
    "SELECT * FROM parcelas WHERE investimento_id = $1 AND status = 'PENDENTE' ORDER BY numero ASC",
    [investimentoId]
  );
  return result.rows;
}

async function findProximaPendente(client, investimentoId) {
  const result = await client.query(
    "SELECT * FROM parcelas WHERE investimento_id = $1 AND status = 'PENDENTE' ORDER BY numero ASC LIMIT 1",
    [investimentoId]
  );
  return result.rows[0];
}

async function marcarParcelaPaga(client, parcelaId) {
  await client.query("UPDATE parcelas SET status = 'PAGO' WHERE id = $1", [parcelaId]);
}

async function marcarPendentesPagas(client, investimentoId) {
  await client.query(
    "UPDATE parcelas SET status = 'PAGO' WHERE investimento_id = $1 AND status = 'PENDENTE'",
    [investimentoId]
  );
}

async function findParcelaByNumeroForUpdate(client, investimentoId, parcelaNumero) {
  const result = await client.query(
    'SELECT * FROM parcelas WHERE investimento_id = $1 AND numero = $2 FOR UPDATE',
    [investimentoId, parcelaNumero]
  );
  return result.rows[0];
}

async function updateParcelaProrrogacao(client, parcelaId, novoValor, novoVencimento) {
  const result = await client.query(
    'UPDATE parcelas SET valor = $1, vencimento = $2 WHERE id = $3 RETURNING *',
    [novoValor, novoVencimento, parcelaId]
  );
  return result.rows[0];
}

async function listByInvestimento(investimentoId) {
  const result = await pool.query(
    'SELECT * FROM parcelas WHERE investimento_id = $1 ORDER BY numero ASC',
    [investimentoId]
  );
  return result.rows;
}

async function sumVencidas() {
  const result = await pool.query(
    "SELECT COALESCE(SUM(valor),0) AS total FROM parcelas WHERE status = 'PENDENTE' AND vencimento < NOW()"
  );
  return result.rows[0].total;
}

module.exports = {
  createParcelas,
  listPendentes,
  findProximaPendente,
  marcarParcelaPaga,
  marcarPendentesPagas,
  findParcelaByNumeroForUpdate,
  updateParcelaProrrogacao,
  listByInvestimento,
  sumVencidas,
};
