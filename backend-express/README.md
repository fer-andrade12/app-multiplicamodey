# MultiplicaMoney MVP (Express)

Stack:
- Node + Express
- PostgreSQL via Docker
- Nodemon para desenvolvimento

Estrutura:
- src/controllers
- src/services
- src/repositories
- src/entities

## Subir stack completa via Docker (modo profissional)

```bash
cd backend-express
docker compose up -d
```

Imagem da API: `multiplicamoney`

Para subir com rebuild limpo:

```bash
docker compose up -d --build
```

Para validar servicos:

```bash
docker compose ps
```

Health da API:

```bash
curl http://localhost:8080/health
```

Limpeza segura somente deste projeto:

```bash
docker compose down --remove-orphans
docker image prune -f
```

## Configurar env

```bash
cp .env.example .env
```

## Instalar deps e rodar

```bash
npm install
npm run dev
```

Use esse passo apenas se quiser rodar a API fora do Docker.

API: http://localhost:8080
Swagger: http://localhost:8080/docs
Frontend (Nginx): http://localhost:3000

## SQL inicial (tabelas)

Se voce ja tinha a estrutura antiga (emprestimos/investimentos), recrie as tabelas:

```sql
DROP TABLE IF EXISTS prorrogacoes;
DROP TABLE IF EXISTS pagamentos;
DROP TABLE IF EXISTS parcelas;
DROP TABLE IF EXISTS investimentos;
DROP TABLE IF EXISTS enderecos;
DROP TABLE IF EXISTS clientes;
```

```sql
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  rg TEXT NOT NULL,
  renda_mensal NUMERIC NOT NULL,
  tipo_trabalho TEXT NOT NULL,
  data_cadastro TIMESTAMP DEFAULT NOW()
);

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
```

## Endpoints MVP

- GET /health
- POST /clientes
- GET /clientes
- GET /clientes/:id
- POST /clientes/:id/enderecos
- GET /clientes/:id/enderecos
- POST /clientes/:id/simulacoes
- POST /clientes/:id/investimentos
- GET /clientes/:id/investimentos
- GET /investimentos/:id
- POST /investimentos/:id/pagamentos
- POST /investimentos/:id/prorrogacoes
- GET /dashboard/resumo
- GET /calculadora/juros/simples?principal=1000&taxa=0.02&meses=12
- GET /calculadora/juros/compostos?principal=1000&taxa=0.02&meses=12
- GET /calculadora/risco?renda=3000
- GET /calculadora/limites
