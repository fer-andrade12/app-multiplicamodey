function toPagamento(row) {
  if (!row) return null;
  return {
    id: row.id,
    investimento_id: row.investimento_id,
    valor: Number(row.valor),
    data_pagamento: row.data_pagamento,
  };
}

module.exports = { toPagamento };
