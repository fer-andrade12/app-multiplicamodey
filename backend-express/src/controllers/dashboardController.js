const express = require('express');
const dashboardService = require('../services/dashboardService');

const router = express.Router();

router.get('/resumo', async (req, res) => {
  try {
    const resumo = await dashboardService.calcularResumo();
    res.json(resumo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/completo', async (req, res) => {
  try {
    const completo = await dashboardService.calcularCompleto();
    res.json(completo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
