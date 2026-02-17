const MAX_TAXA_MENSAL = 0.2;

function jurosSimples(principal, taxa, meses) {
  return principal * taxa * meses;
}

function jurosCompostos(principal, taxa, meses) {
  return principal * (Math.pow(1 + taxa, meses) - 1);
}

function parcelaPrice(principal, taxa, meses) {
  const p = Number(principal);
  const i = Number(taxa);
  const n = Number(meses);

  if (n <= 0) return 0;
  if (i === 0) return p / n;

  const fator = Math.pow(1 + i, n);
  return (p * i * fator) / (fator - 1);
}

function totalPrice(principal, taxa, meses) {
  return parcelaPrice(principal, taxa, meses) * Number(meses);
}

function jurosPrice(principal, taxa, meses) {
  return totalPrice(principal, taxa, meses) - Number(principal);
}

function riscoPorRenda(renda) {
  if (renda < 1500) return 'ALTO';
  if (renda < 4000) return 'MEDIO';
  return 'BAIXO';
}

function validarTaxa(taxa) {
  return Number(taxa) <= MAX_TAXA_MENSAL;
}

function validarParcela(valorParcela, rendaMensal) {
  return Number(valorParcela) <= Number(rendaMensal) * 0.4;
}

module.exports = {
  MAX_TAXA_MENSAL,
  jurosSimples,
  jurosCompostos,
  parcelaPrice,
  totalPrice,
  jurosPrice,
  riscoPorRenda,
  validarTaxa,
  validarParcela,
};
