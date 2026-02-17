const { pool } = require('../src/repositories/db');

const investimentoId = Number(process.env.EXPLAIN_INVESTIMENTO_ID || 1);
const limit = Number(process.env.EXPLAIN_LIMIT || 100);

const queries = [
  {
    name: 'dashboard_resumo',
    sql: `
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT
        COALESCE((SELECT SUM(valor_principal) FROM investimentos), 0) AS total_investido,
        COALESCE((SELECT SUM(valor_juros) FROM investimentos), 0) AS total_lucro_previsto,
        COALESCE((SELECT SUM(saldo_devedor) FROM investimentos WHERE status <> 'QUITADO'), 0) AS total_a_receber,
        COALESCE((SELECT SUM(valor) FROM pagamentos), 0) AS total_recebido,
        COALESCE((SELECT SUM(valor) FROM parcelas WHERE status = 'PENDENTE' AND vencimento < NOW()), 0) AS total_vencido
    `,
  },
  {
    name: 'parcelas_proxima_pendente',
    sql: `
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT *
      FROM parcelas
      WHERE investimento_id = ${investimentoId} AND status = 'PENDENTE'
      ORDER BY numero ASC
      LIMIT 1
    `,
  },
  {
    name: 'investimentos_lista',
    sql: `
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT i.*, c.nome AS cliente_nome, c.cpf AS cliente_cpf
      FROM investimentos i
      JOIN clientes c ON c.id = i.cliente_id
      ORDER BY i.id DESC
      LIMIT ${limit}
    `,
  },
  {
    name: 'clientes_lista',
    sql: `
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT *
      FROM clientes
      ORDER BY id DESC
      LIMIT ${limit}
    `,
  },
  {
    name: 'enderecos_por_cliente_cep',
    sql: `
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT *
      FROM enderecos
      WHERE cliente_id = 1 AND cep = '30123000'
      LIMIT 1
    `,
  },
];

async function run() {
  try {
    for (const query of queries) {
      const result = await pool.query(query.sql);
      console.log(`\n========== ${query.name} ==========`);
      console.log(result.rows.map((row) => row['QUERY PLAN']).join('\n'));
    }
  } catch (err) {
    console.error('Falha ao executar EXPLAIN:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
