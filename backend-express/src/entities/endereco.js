function toEndereco(row) {
  if (!row) return null;
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    cep: row.cep,
    logradouro: row.logradouro,
    numero: row.numero,
    complemento: row.complemento,
    bairro: row.bairro,
    cidade: row.cidade,
    estado: row.estado,
    tipo: row.tipo,
    data_cadastro: row.data_cadastro,
  };
}

module.exports = { toEndereco };
