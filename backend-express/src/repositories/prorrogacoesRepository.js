async function createProrrogacao(client, investimentoId, mesesAdicionados, novaTaxa) {
  const result = await client.query(
    'INSERT INTO prorrogacoes (investimento_id, meses_adicionados, nova_taxa) VALUES ($1,$2,$3) RETURNING *',
    [investimentoId, mesesAdicionados, novaTaxa]
  );
  return result.rows[0];
}

async function lockInvestimento(client, investimentoId) {
  const result = await client.query('SELECT * FROM investimentos WHERE id = $1 FOR UPDATE', [investimentoId]);
  return result.rows[0];
}

module.exports = { createProrrogacao, lockInvestimento };
