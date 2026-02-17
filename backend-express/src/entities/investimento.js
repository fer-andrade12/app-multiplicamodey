function toInvestimento(row) {
  if (!row) return null;
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    cliente_nome: row.cliente_nome,
    cliente_cpf: row.cliente_cpf,
    valor_principal: Number(row.valor_principal),
    taxa_juros: Number(row.taxa_juros),
    tipo_juros: row.tipo_juros,
    quantidade_parcelas: Number(row.quantidade_parcelas),
    valor_juros: Number(row.valor_juros),
    valor_total: Number(row.valor_total),
    valor_parcela: Number(row.valor_parcela),
    saldo_devedor: Number(row.saldo_devedor),
    status: row.status,
    data_inicio: row.data_inicio,
  };
}

module.exports = { toInvestimento };
