const express = require('express');
const simulacaoService = require('../services/simulacaoService');

const router = express.Router();

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.post('/', async (req, res) => {
  const clienteId = parseId(req.body.codicoCliente ?? req.body.codigoCliente);
  if (!clienteId) return res.status(400).json({ error: 'ID invalido' });

  const { valor_principal, taxa_juros, quantidade_parcelas, tipo_juros } = req.body;
  if (valor_principal == null || taxa_juros == null || quantidade_parcelas == null || !tipo_juros) {
    return res.status(400).json({ error: 'Campos obrigatorios faltando' });
  }

  try {
    const result = await simulacaoService.simular(clienteId, {
      valor_principal,
      taxa_juros,
      quantidade_parcelas,
      tipo_juros,
    });

    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
