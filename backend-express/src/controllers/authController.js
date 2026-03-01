const express = require('express');
const authService = require('../services/authService');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', async (req, res) => {
  const result = await authService.login({
    email: req.body?.email,
    senha: req.body?.senha,
  });

  if (!result.ok) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }

  return res.json({
    accessToken: result.accessToken,
    user: result.user,
  });
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

router.get('/usuarios', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  try {
    const users = await authService.listUsuarios();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/clientes-lookup', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const result = await authService.buscarClientePorCpf(req.query?.cpf);
  if (!result.ok) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }
  return res.json(result.cliente);
});

router.post('/usuarios', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const result = await authService.createUsuarioByAdmin(req.body || {});
  if (!result.ok) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }
  return res.status(201).json(result.user);
});

router.put('/usuarios/:codigoUsuario', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const result = await authService.updateUsuarioByAdmin(req.params.codigoUsuario, req.body || {});
  if (!result.ok) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }
  return res.json(result.user);
});

router.delete('/usuarios/:codigoUsuario', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const result = await authService.deleteUsuarioByAdmin(req.params.codigoUsuario);
  if (!result.ok) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }
  return res.status(204).send();
});

router.put('/usuarios/:codigoUsuario/senha', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const result = await authService.updateSenhaByAdmin(req.params.codigoUsuario, req.body?.nova_senha);
  if (!result.ok) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }
  return res.status(204).send();
});

router.put('/minha-senha', requireAuth, async (req, res) => {
  const result = await authService.updateMinhaSenha(req.user?.id, req.body?.senha_atual, req.body?.nova_senha);
  if (!result.ok) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }
  return res.status(204).send();
});

module.exports = router;
