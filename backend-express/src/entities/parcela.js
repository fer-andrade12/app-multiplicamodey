function toParcela(row) {
  if (!row) return null;
  return {
    id: row.id,
    investimento_id: row.investimento_id,
    numero: Number(row.numero),
    valor: Number(row.valor),
    vencimento: row.vencimento,
    status: row.status,
  };
}

module.exports = { toParcela };
