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

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_clientes_email ON clientes(email);

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
