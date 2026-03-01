const { verifyAccessToken } = require('../utils/token');
const authService = require('../services/authService');

function getBearerToken(authorization) {
  const value = String(authorization || '').trim();
  if (!value.toLowerCase().startsWith('bearer ')) return null;
  return value.slice(7).trim();
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Token de autenticacao ausente.' });

    const decoded = verifyAccessToken(token);
    const userId = Number(decoded.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'Token invalido.' });
    }

    const user = await authService.getUsuarioById(userId);
    if (!user || !user.ativo) {
      return res.status(401).json({ error: 'Usuario inativo ou nao encontrado.' });
    }

    req.user = user;
    return next();
  } catch (_err) {
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }
}

function requireRole(...allowedRoles) {
  const allowed = new Set(allowedRoles.map((role) => String(role || '').toUpperCase()));

  return (req, res, next) => {
    const userRole = String(req.user?.role || '').toUpperCase();
    if (!allowed.has(userRole)) {
      return res.status(403).json({ error: 'Acesso negado para este perfil.' });
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
