const express = require('express');
const calculadoraService = require('../services/calculadoraService');

const router = express.Router();

router.get('/juros/simples', (req, res) => {
  const principal = Number(req.query.principal || 0);
  const taxa = Number(req.query.taxa || 0);
  const meses = Number(req.query.meses || 0);
  res.json({ juros: calculadoraService.jurosSimples(principal, taxa, meses) });
});

router.get('/juros/compostos', (req, res) => {
  const principal = Number(req.query.principal || 0);
  const taxa = Number(req.query.taxa || 0);
  const meses = Number(req.query.meses || 0);
  res.json({ juros: calculadoraService.jurosCompostos(principal, taxa, meses) });
});

router.get('/price', (req, res) => {
  const principal = Number(req.query.principal || 0);
  const taxa = Number(req.query.taxa || 0);
  const meses = Number(req.query.meses || 0);

  const parcela = calculadoraService.parcelaPrice(principal, taxa, meses);
  const totalPago = calculadoraService.totalPrice(principal, taxa, meses);
  const jurosTotal = calculadoraService.jurosPrice(principal, taxa, meses);

  res.json({ parcela, total_pago: totalPago, juros_total: jurosTotal });
});

router.get('/risco', (req, res) => {
  const renda = Number(req.query.renda || 0);
  res.json({ risco: calculadoraService.riscoPorRenda(renda) });
});

router.get('/limites', (req, res) => {
  res.json({ max_taxa_mensal: calculadoraService.MAX_TAXA_MENSAL, parcela_max_renda: 0.4 });
});

module.exports = router;
