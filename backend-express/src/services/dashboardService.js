const { pool } = require('../repositories/db');

async function calcularResumo() {
  const resumo = await pool.query(`
    SELECT
      COALESCE((SELECT SUM(valor_principal) FROM investimentos), 0) AS total_investido,
      COALESCE((SELECT SUM(valor_juros) FROM investimentos), 0) AS total_lucro_previsto,
      COALESCE((SELECT SUM(saldo_devedor) FROM investimentos WHERE status != 'QUITADO'), 0) AS total_a_receber,
      COALESCE((SELECT SUM(valor) FROM pagamentos), 0) AS total_recebido,
      COALESCE((SELECT SUM(valor) FROM parcelas WHERE status = 'PENDENTE' AND vencimento < NOW()), 0) AS total_vencido,
      COALESCE((
        SELECT COUNT(DISTINCT i.cliente_id)
        FROM investimentos i
        JOIN parcelas p ON p.investimento_id = i.id
        WHERE p.status = 'PENDENTE'
          AND p.vencimento < NOW()
          AND i.status != 'QUITADO'
      ), 0) AS clientes_em_atraso
  `);

  const totalInvestidoVal = Number(resumo.rows[0].total_investido);
  const totalLucroPrevistoVal = Number(resumo.rows[0].total_lucro_previsto);
  const totalAReceberVal = Number(resumo.rows[0].total_a_receber);
  const totalRecebidoVal = Number(resumo.rows[0].total_recebido);
  const totalVencidoVal = Number(resumo.rows[0].total_vencido);
  const clientesEmAtrasoVal = Number(resumo.rows[0].clientes_em_atraso);

  const totalTotal = totalInvestidoVal + totalLucroPrevistoVal;
  const fatorRestante = totalTotal > 0 ? totalAReceberVal / totalTotal : 0;
  const principalRestanteEst = totalInvestidoVal * fatorRestante;
  const principalRecebidoEst = totalInvestidoVal - principalRestanteEst;
  const lucroRealEst = totalRecebidoVal - principalRecebidoEst;

  return {
    total_investido: totalInvestidoVal,
    total_em_aberto: totalAReceberVal,
    total_vencido: totalVencidoVal,
    clientes_em_atraso: clientesEmAtrasoVal,
    total_recebido: totalRecebidoVal,
    lucro_real: Number(lucroRealEst),
    lucro_previsto: totalLucroPrevistoVal,
  };
}

async function calcularCompleto() {
  const totais = await pool.query(`
    SELECT
      COALESCE((SELECT SUM(valor_principal) FROM investimentos), 0) AS total_investido,
      COALESCE((SELECT SUM(valor_juros) FROM investimentos), 0) AS lucro_total,
      COALESCE((SELECT SUM(valor) FROM pagamentos), 0) AS receita_bruta,
      COALESCE((SELECT SUM(saldo_devedor) FROM investimentos WHERE status != 'QUITADO'), 0) AS total_em_aberto,
      COALESCE((SELECT COUNT(*) FROM clientes), 0) AS total_clientes,
      COALESCE((
        SELECT COUNT(DISTINCT i.cliente_id)
        FROM investimentos i
        JOIN parcelas p ON p.investimento_id = i.id
        WHERE p.status = 'PENDENTE'
          AND p.vencimento < NOW()
          AND i.status != 'QUITADO'
      ), 0) AS clientes_em_atraso
  `);

  const volumeClientesMes = await pool.query(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', data_cadastro), 'YYYY-MM') AS referencia,
      COUNT(*)::INTEGER AS quantidade
    FROM clientes
    GROUP BY 1
    ORDER BY 1 DESC
  `);

  const totalInvestidoVal = Number(totais.rows[0].total_investido);
  const lucroTotalVal = Number(totais.rows[0].lucro_total);
  const receitaBrutaVal = Number(totais.rows[0].receita_bruta);
  const totalEmAbertoVal = Number(totais.rows[0].total_em_aberto);
  const totalClientesVal = Number(totais.rows[0].total_clientes);
  const clientesEmAtrasoVal = Number(totais.rows[0].clientes_em_atraso);

  const totalContrato = totalInvestidoVal + lucroTotalVal;
  const fatorRestante = totalContrato > 0 ? totalEmAbertoVal / totalContrato : 0;
  const principalRestanteEst = totalInvestidoVal * fatorRestante;
  const principalRecebidoEst = totalInvestidoVal - principalRestanteEst;
  const lucroRecebidoCalc = receitaBrutaVal - principalRecebidoEst;
  const lucroRecebidoVal = Number.isFinite(lucroRecebidoCalc) ? Math.max(lucroRecebidoCalc, 0) : 0;
  const lucroAReceberVal = Math.max(lucroTotalVal - lucroRecebidoVal, 0);

  return {
    total_investido: totalInvestidoVal,
    lucro_total: lucroTotalVal,
    lucro_recebido: lucroRecebidoVal,
    lucro_a_receber: lucroAReceberVal,
    total_clientes: totalClientesVal,
    clientes_em_atraso: clientesEmAtrasoVal,
    receita_bruta: receitaBrutaVal,
    receita_liquida: lucroRecebidoVal,
    volume_clientes_mes: volumeClientesMes.rows.map((item) => ({
      referencia: item.referencia,
      quantidade: Number(item.quantidade),
    })),
  };
}

module.exports = { calcularResumo, calcularCompleto };
