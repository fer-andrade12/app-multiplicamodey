const { pool } = require('./db');

async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM usuarios WHERE lower(email) = lower($1) LIMIT 1', [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM usuarios WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] || null;
}

async function countAdmins() {
  const result = await pool.query("SELECT COUNT(*)::INTEGER AS total FROM usuarios WHERE role = 'ADMIN'");
  return Number(result.rows[0]?.total || 0);
}

async function countAdminsAtivosExcept(exceptUserId = null) {
  if (exceptUserId == null) {
    const result = await pool.query(
      "SELECT COUNT(*)::INTEGER AS total FROM usuarios WHERE role = 'ADMIN' AND ativo = TRUE"
    );
    return Number(result.rows[0]?.total || 0);
  }

  const result = await pool.query(
    "SELECT COUNT(*)::INTEGER AS total FROM usuarios WHERE role = 'ADMIN' AND ativo = TRUE AND id <> $1",
    [exceptUserId]
  );
  return Number(result.rows[0]?.total || 0);
}

async function createUsuario(data) {
  const perfil = data.role === 'ADMIN' ? 'ADMIN' : 'OPERADOR';

  const result = await pool.query(
    'INSERT INTO usuarios (nome, usuario, email, senha_hash, perfil, role, cliente_id, ativo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nome, email, role, cliente_id, ativo, data_cadastro',
    [
      data.nome,
      data.email,
      data.email,
      data.senha_hash,
      perfil,
      data.role,
      data.cliente_id ?? null,
      data.ativo ?? true,
    ]
  );
  return result.rows[0];
}

async function listUsuarios() {
  const result = await pool.query(
    'SELECT id, nome, email, role, cliente_id, ativo, data_cadastro FROM usuarios ORDER BY id DESC'
  );
  return result.rows;
}

async function updateUsuario(id, data) {
  const perfil = data.role === 'ADMIN' ? 'ADMIN' : 'OPERADOR';

  const result = await pool.query(
    `
      UPDATE usuarios
      SET
        nome = $1,
        usuario = $2,
        email = $3,
        perfil = $4,
        role = $5,
        cliente_id = $6,
        ativo = $7
      WHERE id = $8
      RETURNING id, nome, email, role, cliente_id, ativo, data_cadastro
    `,
    [
      data.nome,
      data.email,
      data.email,
      perfil,
      data.role,
      data.cliente_id ?? null,
      data.ativo,
      id,
    ]
  );
  return result.rows[0] || null;
}

async function updateSenha(id, senhaHash) {
  const result = await pool.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2 RETURNING id', [senhaHash, id]);
  return result.rows[0] || null;
}

async function deleteUsuario(id) {
  const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = {
  findByEmail,
  findById,
  countAdmins,
  countAdminsAtivosExcept,
  createUsuario,
  listUsuarios,
  updateUsuario,
  updateSenha,
  deleteUsuario,
};
