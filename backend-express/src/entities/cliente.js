function toCliente(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    cpf: row.cpf,
    rg: row.rg,
    renda_mensal: Number(row.renda_mensal),
    tipo_trabalho: row.tipo_trabalho,
    data_cadastro: row.data_cadastro,
  };
}

module.exports = { toCliente };
