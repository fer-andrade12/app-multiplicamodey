async function createPagamento(client, investimentoId, valor) {
  const result = await client.query(
    'INSERT INTO pagamentos (investimento_id, valor) VALUES ($1,$2) RETURNING *',
    [investimentoId, valor]
  );
  return result.rows[0];
}

async function lockInvestimento(client, investimentoId) {
  const result = await client.query('SELECT * FROM investimentos WHERE id = $1 FOR UPDATE', [investimentoId]);
  return result.rows[0];
}

module.exports = { createPagamento, lockInvestimento };
