CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  cpf TEXT UNIQUE NOT NULL,
  rg TEXT NOT NULL,
  renda_mensal NUMERIC NOT NULL,
  tipo_trabalho TEXT NOT NULL,
  data_cadastro TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clientes'
      AND column_name = 'email'
  ) THEN
    ALTER TABLE clientes ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'clientes'
      AND indexname = 'ux_clientes_email'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX ux_clientes_email ON clientes(email)';
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  usuario TEXT,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil TEXT,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USUARIO')),
  cliente_id INTEGER NULL REFERENCES clientes(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  data_cadastro TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'email'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN email TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'usuario'
  ) THEN
    ALTER TABLE usuarios ALTER COLUMN usuario DROP NOT NULL;
    UPDATE usuarios SET email = lower(usuario) WHERE email IS NULL AND usuario IS NOT NULL;
  ELSE
    ALTER TABLE usuarios ADD COLUMN usuario TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'perfil'
  ) THEN
    ALTER TABLE usuarios ALTER COLUMN perfil DROP NOT NULL;
  ELSE
    ALTER TABLE usuarios ADD COLUMN perfil TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'role'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN role TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'perfil'
  ) THEN
    UPDATE usuarios
    SET role = CASE WHEN upper(perfil) = 'ADMIN' THEN 'ADMIN' ELSE 'USUARIO' END
    WHERE role IS NULL;
  END IF;

  UPDATE usuarios
  SET role = CASE WHEN upper(role) = 'ADMIN' THEN 'ADMIN' ELSE 'USUARIO' END
  WHERE role IS NOT NULL;

  UPDATE usuarios
  SET usuario = COALESCE(usuario, email)
  WHERE email IS NOT NULL;

  UPDATE usuarios
  SET perfil = CASE WHEN role = 'ADMIN' THEN 'ADMIN' ELSE 'OPERADOR' END
  WHERE role IS NOT NULL;

  UPDATE usuarios
  SET role = 'ADMIN'
  WHERE role IS NULL;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'cliente_id'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN cliente_id INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usuarios_cliente_id_fkey'
      AND conrelid = 'usuarios'::regclass
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT usuarios_cliente_id_fkey
      FOREIGN KEY (cliente_id)
      REFERENCES clientes(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'ativo'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'data_cadastro'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN data_cadastro TIMESTAMP DEFAULT NOW();
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_cliente_id ON usuarios(cliente_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_cliente_unico ON usuarios(cliente_id) WHERE role = 'USUARIO' AND cliente_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS enderecos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  cep TEXT NOT NULL,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT NULL,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  tipo TEXT NOT NULL,
  data_cadastro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investimentos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  valor_principal NUMERIC NOT NULL,
  taxa_juros NUMERIC NOT NULL,
  tipo_juros TEXT NOT NULL,
  quantidade_parcelas INTEGER NOT NULL,
  valor_juros NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_parcela NUMERIC NOT NULL,
  saldo_devedor NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'ATIVO',
  data_inicio TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  investimento_id INTEGER NOT NULL REFERENCES investimentos(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  data_pagamento TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parcelas (
  id SERIAL PRIMARY KEY,
  investimento_id INTEGER NOT NULL REFERENCES investimentos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  valor NUMERIC NOT NULL,
  vencimento TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE'
);

CREATE TABLE IF NOT EXISTS prorrogacoes (
  id SERIAL PRIMARY KEY,
  investimento_id INTEGER NOT NULL REFERENCES investimentos(id) ON DELETE CASCADE,
  meses_adicionados INTEGER NOT NULL,
  nova_taxa NUMERIC NOT NULL,
  data_prorrogacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investimentos_cliente_id ON investimentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_investimentos_status ON investimentos(status);
CREATE INDEX IF NOT EXISTS idx_investimentos_data_inicio ON investimentos(data_inicio);

CREATE INDEX IF NOT EXISTS idx_pagamentos_investimento_id ON pagamentos(investimento_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_pagamento ON pagamentos(data_pagamento);

CREATE UNIQUE INDEX IF NOT EXISTS ux_parcelas_investimento_numero ON parcelas(investimento_id, numero);
CREATE INDEX IF NOT EXISTS idx_parcelas_investimento_status_numero ON parcelas(investimento_id, status, numero);
CREATE INDEX IF NOT EXISTS idx_parcelas_pendentes_vencimento ON parcelas(vencimento) WHERE status = 'PENDENTE';

CREATE INDEX IF NOT EXISTS idx_enderecos_cliente_id ON enderecos(cliente_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_enderecos_cliente_cep ON enderecos(cliente_id, cep);

CREATE INDEX IF NOT EXISTS idx_prorrogacoes_investimento_id ON prorrogacoes(investimento_id);
