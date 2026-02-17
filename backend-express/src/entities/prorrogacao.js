function toProrrogacao(row) {
  if (!row) return null;
  return {
    id: row.id,
    investimento_id: row.investimento_id,
    meses_adicionados: Number(row.meses_adicionados),
    nova_taxa: Number(row.nova_taxa),
    data_prorrogacao: row.data_prorrogacao,
  };
}

module.exports = { toProrrogacao };
