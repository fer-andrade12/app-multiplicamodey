const express = require('express');
const dashboardService = require('../services/dashboardService');

const router = express.Router();

function isUsuario(req) {
  return String(req.user?.role || '').toUpperCase() === 'USUARIO';
}

function usuarioClienteId(req) {
  const id = Number(req.user?.cliente_id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/resumo', async (req, res) => {
  try {
    const clienteId = isUsuario(req) ? usuarioClienteId(req) : null;
    if (isUsuario(req) && !clienteId) {
      return res.status(403).json({ error: 'USUARIO sem cliente vinculado.' });
    }

    const resumo = await dashboardService.calcularResumo(clienteId);
    res.json(resumo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/completo', async (req, res) => {
  try {
    const clienteId = isUsuario(req) ? usuarioClienteId(req) : null;
    if (isUsuario(req) && !clienteId) {
      return res.status(403).json({ error: 'USUARIO sem cliente vinculado.' });
    }

    const completo = await dashboardService.calcularCompleto(clienteId);
    res.json(completo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
