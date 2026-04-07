const usuariosRepository = require('../repositories/usuariosRepository');
const clientesRepository = require('../repositories/clientesRepository');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const { signAccessToken } = require('../utils/token');

function normalizarTexto(value) {
  return String(value || '').trim();
}

function normalizarEmail(value) {
  return normalizarTexto(value).toLowerCase();
}

function apenasDigitos(value) {
  return String(value || '').replace(/\D/g, '');
}

function sanitizeUsuario(usuario) {
  if (!usuario) return null;
  return {
    id: Number(usuario.id),
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    cliente_id: usuario.cliente_id == null ? null : Number(usuario.cliente_id),
    ativo: Boolean(usuario.ativo),
    data_cadastro: usuario.data_cadastro,
  };
}

function validarRole(role) {
  const normalized = normalizarTexto(role).toUpperCase();
  return normalized === 'ADMIN' || normalized === 'USUARIO' || normalized === 'VISUALIZADOR'
    ? normalized
    : null;
}

async function resolverClientePorCpf(cpfEntrada) {
  const cpf = apenasDigitos(cpfEntrada).slice(0, 11);
  if (!cpf || cpf.length < 3) {
    return { ok: false, error: 'Informe ao menos 3 digitos do CPF.', statusCode: 400 };
  }

  if (cpf.length === 11) {
    const clienteExato = await clientesRepository.findClienteByCpf(cpf);
    if (!clienteExato) {
      return { ok: false, error: 'Cliente nao encontrado para o CPF informado.', statusCode: 404 };
    }
    return { ok: true, cliente: clienteExato };
  }

  const candidatos = await clientesRepository.findClientesByCpfPrefix(cpf, 10);
  if (!Array.isArray(candidatos) || candidatos.length === 0) {
    return { ok: false, error: 'Nenhum cliente encontrado para o prefixo de CPF informado.', statusCode: 404 };
  }

  if (candidatos.length > 1) {
    return { ok: false, error: 'CPF parcial ambiguo. Informe mais digitos para identificar um unico cliente.', statusCode: 409 };
  }

  return { ok: true, cliente: candidatos[0] };
}

async function login({ email, senha }) {
  const emailNormalizado = normalizarEmail(email);
  const senhaNormalizada = String(senha || '');

  if (!emailNormalizado || !senhaNormalizada) {
    return { ok: false, error: 'Email e senha sao obrigatorios.', statusCode: 400 };
  }

  const usuario = await usuariosRepository.findByEmail(emailNormalizado);
  if (!usuario || !usuario.ativo) {
    return { ok: false, error: 'Credenciais invalidas.', statusCode: 401 };
  }

  const senhaCorreta = await comparePassword(senhaNormalizada, usuario.senha_hash);
  if (!senhaCorreta) {
    return { ok: false, error: 'Credenciais invalidas.', statusCode: 401 };
  }

  const payload = {
    sub: String(usuario.id),
    role: usuario.role,
    cliente_id: usuario.cliente_id == null ? null : Number(usuario.cliente_id),
  };

  const accessToken = signAccessToken(payload);

  return {
    ok: true,
    accessToken,
    user: sanitizeUsuario(usuario),
  };
}

async function getUsuarioById(id) {
  const usuario = await usuariosRepository.findById(id);
  return sanitizeUsuario(usuario);
}

async function listUsuarios() {
  const usuarios = await usuariosRepository.listUsuarios();
  return usuarios.map(sanitizeUsuario);
}

async function createUsuarioByAdmin(data) {
  const cpfCliente = apenasDigitos(data.cliente_cpf).slice(0, 11);
  let clientePorCpf = null;
  if (cpfCliente) {
    const resolucaoCliente = await resolverClientePorCpf(cpfCliente);
    if (!resolucaoCliente.ok) return resolucaoCliente;
    clientePorCpf = resolucaoCliente.cliente;
  }

  const nome = normalizarTexto(data.nome || clientePorCpf?.nome);
  const email = normalizarEmail(data.email || clientePorCpf?.email);
  const senha = String(data.senha || '');
  const role = validarRole(data.role);
  const clienteId = data.cliente_id == null || data.cliente_id === '' ? null : Number(data.cliente_id);

  if (!nome || !email || !senha || !role) {
    return { ok: false, error: 'Campos obrigatorios: nome, email, senha, role.', statusCode: 400 };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Email invalido.', statusCode: 400 };
  }

  if (senha.length < 6) {
    return { ok: false, error: 'Senha deve conter ao menos 6 caracteres.', statusCode: 400 };
  }

  let clienteFinal = null;
  if (role === 'USUARIO') {
    if (Number.isInteger(clienteId) && clienteId > 0) {
      const cliente = await clientesRepository.findClienteById(clienteId);
      if (!cliente) {
        return { ok: false, error: 'Cliente vinculado nao encontrado.', statusCode: 404 };
      }
      clienteFinal = clienteId;
    } else if (clientePorCpf?.id) {
      clienteFinal = Number(clientePorCpf.id);
    }
  }

  const senha_hash = await hashPassword(senha);

  try {
    const usuario = await usuariosRepository.createUsuario({
      nome,
      email,
      senha_hash,
      role,
      cliente_id: role === 'USUARIO' ? clienteFinal : null,
      ativo: true,
    });

    return { ok: true, user: sanitizeUsuario(usuario) };
  } catch (err) {
    if (err?.code === '23505') {
      return { ok: false, error: 'Email ja cadastrado ou cliente ja possui usuario.', statusCode: 409 };
    }
    return { ok: false, error: err.message, statusCode: 500 };
  }
}

async function updateUsuarioByAdmin(usuarioId, data) {
  const id = Number(usuarioId);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: 'ID de usuario invalido.', statusCode: 400 };
  }

  const existente = await usuariosRepository.findById(id);
  if (!existente) {
    return { ok: false, error: 'Usuario nao encontrado.', statusCode: 404 };
  }

  const nome = normalizarTexto(data.nome);
  const email = normalizarEmail(data.email);
  const role = validarRole(data.role);
  const clienteId = data.cliente_id == null || data.cliente_id === '' ? null : Number(data.cliente_id);
  const ativo = typeof data.ativo === 'boolean' ? data.ativo : String(data.ativo) !== 'false';

  if (!nome || !email || !role) {
    return { ok: false, error: 'Campos obrigatorios: nome, email, role.', statusCode: 400 };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Email invalido.', statusCode: 400 };
  }

  if (role === 'USUARIO' && Number.isInteger(clienteId) && clienteId > 0) {
    const cliente = await clientesRepository.findClienteById(clienteId);
    if (!cliente) {
      return { ok: false, error: 'Cliente vinculado nao encontrado.', statusCode: 404 };
    }
  }

  const clienteFinal = role === 'USUARIO' && Number.isInteger(clienteId) && clienteId > 0 ? clienteId : null;
  const semAlteracao =
    normalizarTexto(existente.nome) === nome
    && normalizarEmail(existente.email) === email
    && String(existente.role || '').toUpperCase() === role
    && Number(existente.cliente_id || 0) === Number(clienteFinal || 0)
    && Boolean(existente.ativo) === Boolean(ativo);

  if (semAlteracao) {
    return { ok: false, error: 'Nenhuma alteracao detectada para este usuario.', statusCode: 400 };
  }

  if ((existente.role === 'ADMIN' && role !== 'ADMIN') || (existente.role === 'ADMIN' && !ativo)) {
    const adminsRestantes = await usuariosRepository.countAdminsAtivosExcept(id);
    if (adminsRestantes <= 0) {
      return { ok: false, error: 'Nao e permitido remover ou inativar o ultimo ADMIN ativo.', statusCode: 400 };
    }
  }

  try {
    const atualizado = await usuariosRepository.updateUsuario(id, {
      nome,
      email,
      role,
      cliente_id: clienteFinal,
      ativo,
    });

    return { ok: true, user: sanitizeUsuario(atualizado) };
  } catch (err) {
    if (err?.code === '23505') {
      return { ok: false, error: 'Email ja cadastrado ou cliente ja possui usuario.', statusCode: 409 };
    }
    return { ok: false, error: err.message, statusCode: 500 };
  }
}

async function buscarClientePorCpf(cpf) {
  const resolucaoCliente = await resolverClientePorCpf(cpf);
  if (!resolucaoCliente.ok) {
    return resolucaoCliente;
  }
  const cliente = resolucaoCliente.cliente;

  return {
    ok: true,
    cliente: {
      id: Number(cliente.id),
      nome: cliente.nome,
      email: cliente.email,
      cpf: cliente.cpf,
    },
  };
}

async function deleteUsuarioByAdmin(usuarioId) {
  const id = Number(usuarioId);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: 'ID de usuario invalido.', statusCode: 400 };
  }

  const existente = await usuariosRepository.findById(id);
  if (!existente) {
    return { ok: false, error: 'Usuario nao encontrado.', statusCode: 404 };
  }

  if (existente.role === 'ADMIN' && existente.ativo) {
    const adminsRestantes = await usuariosRepository.countAdminsAtivosExcept(id);
    if (adminsRestantes <= 0) {
      return { ok: false, error: 'Nao e permitido excluir o ultimo ADMIN ativo.', statusCode: 400 };
    }
  }

  const deleted = await usuariosRepository.deleteUsuario(id);
  if (!deleted) {
    return { ok: false, error: 'Usuario nao encontrado.', statusCode: 404 };
  }

  return { ok: true };
}

async function updateSenhaByAdmin(usuarioId, novaSenha) {
  const id = Number(usuarioId);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: 'ID de usuario invalido.', statusCode: 400 };
  }

  const senha = String(novaSenha || '');
  if (senha.length < 6) {
    return { ok: false, error: 'Senha deve conter ao menos 6 caracteres.', statusCode: 400 };
  }

  const existente = await usuariosRepository.findById(id);
  if (!existente) {
    return { ok: false, error: 'Usuario nao encontrado.', statusCode: 404 };
  }

  const senhaHash = await hashPassword(senha);
  await usuariosRepository.updateSenha(id, senhaHash);
  return { ok: true };
}

async function updateMinhaSenha(usuarioId, senhaAtual, novaSenha) {
  const id = Number(usuarioId);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: 'Usuario invalido.', statusCode: 400 };
  }

  const atual = String(senhaAtual || '');
  const nova = String(novaSenha || '');

  if (!atual || !nova) {
    return { ok: false, error: 'Senha atual e nova senha sao obrigatorias.', statusCode: 400 };
  }

  if (nova.length < 6) {
    return { ok: false, error: 'Nova senha deve conter ao menos 6 caracteres.', statusCode: 400 };
  }

  const usuario = await usuariosRepository.findById(id);
  if (!usuario || !usuario.ativo) {
    return { ok: false, error: 'Usuario nao encontrado.', statusCode: 404 };
  }

  const confereAtual = await comparePassword(atual, usuario.senha_hash);
  if (!confereAtual) {
    return { ok: false, error: 'Senha atual invalida.', statusCode: 401 };
  }

  const senhaHash = await hashPassword(nova);
  await usuariosRepository.updateSenha(id, senhaHash);
  return { ok: true };
}

async function ensureAdminPrincipal() {
  const nome = normalizarTexto(process.env.ADMIN_NOME || 'Administrador Principal');
  const email = normalizarEmail(process.env.ADMIN_EMAIL || 'admin@multiplicamoney.local');
  const senha = String(process.env.ADMIN_PASSWORD || 'admin123456');

  const existente = await usuariosRepository.findByEmail(email);
  if (existente) return;

  const senha_hash = await hashPassword(senha);
  await usuariosRepository.createUsuario({
    nome,
    email,
    senha_hash,
    role: 'ADMIN',
    cliente_id: null,
    ativo: true,
  });

  console.log(`Admin principal inicializado: ${email}`);
}

module.exports = {
  login,
  getUsuarioById,
  listUsuarios,
  createUsuarioByAdmin,
  updateUsuarioByAdmin,
  deleteUsuarioByAdmin,
  updateSenhaByAdmin,
  updateMinhaSenha,
  buscarClientePorCpf,
  ensureAdminPrincipal,
};
