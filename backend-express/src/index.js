const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { pool } = require('./repositories/db');

const healthController = require('./controllers/healthController');
const clientesController = require('./controllers/clientesController');
const investimentosController = require('./controllers/investimentosController');
const calculadoraController = require('./controllers/calculadoraController');
const dashboardController = require('./controllers/dashboardController');
const simulacaoController = require('./controllers/simulacaoController');

const app = express();
app.use(cors());
app.use(express.json());

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'MultiplicaMoney API',
    version: '1.0.0',
    description: 'MVP Express API for loans and investments',
  },
  servers: [
    { url: `http://localhost:${process.env.PORT || 8080}`, description: 'Local API' },
  ],
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mensagem de erro' },
        },
      },
      ClienteCreate: {
        type: 'object',
        required: ['nome', 'email', 'cpf', 'rg', 'renda_mensal', 'tipo_trabalho'],
        properties: {
          nome: { type: 'string', example: 'Joao Silva' },
          email: { type: 'string', format: 'email', example: 'joao@empresa.com' },
          cpf: { type: 'string', example: '12345678900' },
          rg: { type: 'string', example: 'MG123456' },
          renda_mensal: { type: 'number', example: 3500 },
          tipo_trabalho: { type: 'string', example: 'CLT' },
        },
      },
      Cliente: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nome: { type: 'string' },
          email: { type: 'string', format: 'email' },
          cpf: { type: 'string' },
          rg: { type: 'string' },
          renda_mensal: { type: 'number' },
          tipo_trabalho: { type: 'string' },
          data_cadastro: { type: 'string', format: 'date-time' },
        },
      },
      EnderecoCreate: {
        type: 'object',
        required: ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado', 'tipo'],
        properties: {
          cep: { type: 'string', example: '30123-000' },
          logradouro: { type: 'string', example: 'Rua A' },
          numero: { type: 'string', example: '123' },
          complemento: { type: 'string', example: 'Apto 12' },
          bairro: { type: 'string', example: 'Centro' },
          cidade: { type: 'string', example: 'Belo Horizonte' },
          estado: { type: 'string', example: 'MG' },
          tipo: { type: 'string', example: 'RESIDENCIAL' },
        },
      },
      Endereco: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          cliente_id: { type: 'integer', example: 1 },
          cep: { type: 'string' },
          logradouro: { type: 'string' },
          numero: { type: 'string' },
          complemento: { type: 'string' },
          bairro: { type: 'string' },
          cidade: { type: 'string' },
          estado: { type: 'string' },
          tipo: { type: 'string' },
          data_cadastro: { type: 'string', format: 'date-time' },
        },
      },
      SimulacaoCreate: {
        type: 'object',
        required: ['codicoCliente', 'valor_principal', 'taxa_juros', 'quantidade_parcelas', 'tipo_juros'],
        properties: {
          codicoCliente: { type: 'integer', example: 1 },
          valor_principal: { type: 'number', example: 10000 },
          taxa_juros: { type: 'number', example: 0.02 },
          quantidade_parcelas: { type: 'integer', example: 12 },
          tipo_juros: { type: 'string', example: 'COMPOSTO' },
        },
      },
      SimulacaoResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          cliente_id: { type: 'integer', example: 1 },
          risco: { type: 'string', example: 'MEDIO' },
          valor_principal: { type: 'number' },
          taxa_juros: { type: 'number' },
          quantidade_parcelas: { type: 'integer' },
          tipo_juros: { type: 'string' },
          data_simulacao: { type: 'string', format: 'date-time', example: '2026-02-16T13:45:00.000Z' },
          valor_total: { type: 'number' },
          valor_juros: { type: 'number' },
          valor_parcela: { type: 'number' },
          parcelas_detalhadas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                numero: { type: 'integer', example: 1 },
                data_vencimento: { type: 'string', example: '2026-03-16' },
                valor_parcela: { type: 'number', example: 1025.32 },
                valor_juros: { type: 'number', example: 200.0 },
                valor_amortizacao: { type: 'number', example: 825.32 },
                saldo_restante: { type: 'number', example: 9174.68 },
              },
            },
          },
        },
      },
      InvestimentoCreate: {
        type: 'object',
        required: ['codicoCliente', 'valor_principal', 'taxa_juros', 'quantidade_parcelas', 'tipo_juros'],
        properties: {
          codicoCliente: { type: 'integer', example: 1 },
          valor_principal: { type: 'number', example: 10000 },
          taxa_juros: { type: 'number', example: 0.02 },
          quantidade_parcelas: { type: 'integer', example: 12 },
          tipo_juros: { type: 'string', example: 'COMPOSTO' },
        },
      },
      Investimento: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          cliente_id: { type: 'integer' },
          cliente_nome: { type: 'string' },
          cliente_cpf: { type: 'string' },
          valor_principal: { type: 'number' },
          taxa_juros: { type: 'number' },
          tipo_juros: { type: 'string' },
          quantidade_parcelas: { type: 'integer' },
          valor_juros: { type: 'number' },
          valor_total: { type: 'number' },
          valor_parcela: { type: 'number' },
          saldo_devedor: { type: 'number' },
          status: { type: 'string' },
          data_inicio: { type: 'string', format: 'date-time' },
        },
      },
      Parcela: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          investimento_id: { type: 'integer' },
          numero: { type: 'integer' },
          valor: { type: 'number' },
          vencimento: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
        },
      },
      PagamentoCreate: {
        type: 'object',
        required: ['codigoInvestimento', 'valor'],
        properties: {
          codigoInvestimento: { type: 'integer', example: 1 },
          valor: { type: 'number', example: 500 },
          parcela_numero: { type: 'integer', example: 1 },
        },
      },
      Pagamento: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          investimento_id: { type: 'integer' },
          valor: { type: 'number' },
          data_pagamento: { type: 'string', format: 'date-time' },
        },
      },
      ProrrogacaoCreate: {
        type: 'object',
        required: ['codigoInvestimento', 'meses_adicionados'],
        properties: {
          codigoInvestimento: { type: 'integer', example: 1 },
          meses_adicionados: { type: 'integer', example: 2 },
          nova_taxa: { type: 'number', example: 0.015 },
        },
      },
      ProrrogacaoParcelaCreate: {
        type: 'object',
        required: ['codigoInvestimento', 'parcela_numero', 'dias_prorrogados'],
        properties: {
          codigoInvestimento: { type: 'integer', example: 1 },
          parcela_numero: { type: 'integer', example: 3 },
          dias_prorrogados: { type: 'integer', example: 10 },
          taxa_juros_dia: { type: 'number', example: 0.02 },
        },
      },
      Prorrogacao: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          investimento_id: { type: 'integer' },
          meses_adicionados: { type: 'integer' },
          nova_taxa: { type: 'number' },
          data_prorrogacao: { type: 'string', format: 'date-time' },
        },
      },
      DashboardResumo: {
        type: 'object',
        properties: {
          total_investido: { type: 'number' },
          total_em_aberto: { type: 'number' },
          total_vencido: { type: 'number' },
          clientes_em_atraso: { type: 'integer' },
          total_recebido: { type: 'number' },
          lucro_real: { type: 'number' },
          lucro_previsto: { type: 'number' },
        },
      },
      DashboardClientesMes: {
        type: 'object',
        properties: {
          referencia: { type: 'string', example: '2026-02' },
          quantidade: { type: 'integer', example: 12 },
        },
      },
      DashboardCompleto: {
        type: 'object',
        properties: {
          total_investido: { type: 'number' },
          lucro_total: { type: 'number' },
          lucro_recebido: { type: 'number' },
          lucro_a_receber: { type: 'number' },
          total_clientes: { type: 'integer' },
          clientes_em_atraso: { type: 'integer' },
          receita_bruta: { type: 'number' },
          receita_liquida: { type: 'number' },
          volume_clientes_mes: { type: 'array', items: { $ref: '#/components/schemas/DashboardClientesMes' } },
        },
      },
    },
  },
  paths: {
    '/health': { get: { summary: 'Health check' } },
    '/clientes': {
      get: {
        summary: 'List clientes',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Cliente' } },
              },
            },
          },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      post: {
        summary: 'Create cliente',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ClienteCreate' } },
          },
        },
        responses: {
          201: { description: 'Criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Cliente' } } } },
          400: { description: 'Erro validacao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/clientes/{codigoCliente}': {
      parameters: [
        {
          name: 'codigoCliente',
          in: 'path',
          required: true,
          schema: { type: 'integer', example: 1 },
          description: 'Codigo numerico do cliente',
        },
      ],
      get: {
        summary: 'Get cliente by id',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Cliente' } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      put: {
        summary: 'Atualizar cliente',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ClienteCreate' } },
          },
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Cliente' } } } },
          400: { description: 'Erro validacao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        summary: 'Excluir cliente',
        responses: {
          204: { description: 'Excluido' },
          400: { description: 'Erro validacao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/clientes/{codigoCliente}/enderecos': {
      parameters: [
        {
          name: 'codigoCliente',
          in: 'path',
          required: true,
          schema: { type: 'integer', example: 1 },
          description: 'Codigo numerico do cliente',
        },
      ],
      get: { summary: 'List enderecos by cliente' },
      post: {
        summary: 'Add endereco',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/EnderecoCreate' } },
          },
        },
        responses: {
          201: { description: 'Criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Endereco' } } } },
          400: { description: 'Erro validacao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/clientes/{codigoCliente}/enderecos/{codigoEndereco}': {
      parameters: [
        {
          name: 'codigoCliente',
          in: 'path',
          required: true,
          schema: { type: 'integer', example: 1 },
          description: 'Codigo numerico do cliente',
        },
        {
          name: 'codigoEndereco',
          in: 'path',
          required: true,
          schema: { type: 'integer', example: 1 },
          description: 'Codigo numerico do endereco',
        },
      ],
      delete: {
        summary: 'Excluir endereco do cliente',
        responses: {
          204: { description: 'Excluido' },
          400: { description: 'Erro validacao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/simulacoes': {
      post: {
        summary: 'Simular investimento',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SimulacaoCreate' } },
          },
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/SimulacaoResponse' } } } },
          400: { description: 'Erro validacao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/clientes/{codigoCliente}/investimentos': {
      parameters: [
        {
          name: 'codigoCliente',
          in: 'path',
          required: true,
          schema: { type: 'integer', example: 1 },
          description: 'Codigo numerico do cliente',
        },
      ],
      get: { summary: 'List investimentos by cliente' },
    },
    '/investimentos': {
      get: {
        summary: 'List investimentos',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Investimento' } } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      post: {
        summary: 'Create investimento',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/InvestimentoCreate' } },
          },
        },
        responses: {
          201: {
            description: 'Criado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    investimento: { $ref: '#/components/schemas/Investimento' },
                    parcelas: { type: 'array', items: { $ref: '#/components/schemas/Parcela' } },
                    risco: { type: 'string' },
                  },
                },
              },
            },
          },
          400: { description: 'Erro validacao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/investimentos/{codigoInvestimento}': {
      parameters: [
        {
          name: 'codigoInvestimento',
          in: 'path',
          required: true,
          schema: { type: 'integer', example: 1 },
          description: 'Codigo numerico do investimento',
        },
      ],
      get: {
        summary: 'Get investimento',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Investimento' } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/investimentos/{codigoInvestimento}/parcelas': {
      parameters: [
        {
          name: 'codigoInvestimento',
          in: 'path',
          required: true,
          schema: { type: 'integer', example: 1 },
          description: 'Codigo numerico do investimento',
        },
      ],
      get: {
        summary: 'List parcelas do investimento',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Parcela' } } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/investimentos/pagamentos': {
      post: {
        summary: 'Register pagamento',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PagamentoCreate' } },
          },
        },
        responses: {
          201: { description: 'Criado', content: { 'application/json': { schema: { type: 'object', properties: { pagamento: { $ref: '#/components/schemas/Pagamento' }, saldo_devedor: { type: 'number' }, status: { type: 'string' } } } } } },
          400: { description: 'Erro validacao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/investimentos/prorrogacoes': {
      post: {
        summary: 'Registrar prorrogacao',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ProrrogacaoCreate' } },
          },
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { investimento: { $ref: '#/components/schemas/Investimento' }, prorrogacao: { $ref: '#/components/schemas/Prorrogacao' } } } } } },
          400: { description: 'Erro validacao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/investimentos/parcelas/prorrogacoes': {
      post: {
        summary: 'Prorrogar parcela especifica em dias com taxa diaria',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ProrrogacaoParcelaCreate' } },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    investimento_id: { type: 'integer' },
                    parcela: { $ref: '#/components/schemas/Parcela' },
                    dias_prorrogados: { type: 'integer' },
                    taxa_juros_dia: { type: 'number' },
                    valor_acrescimo: { type: 'number' },
                    novo_saldo_devedor: { type: 'number' },
                  },
                },
              },
            },
          },
          400: { description: 'Erro validacao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/dashboard/resumo': {
      get: {
        summary: 'Resumo do dashboard',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardResumo' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/dashboard/completo': {
      get: {
        summary: 'Dashboard completo com metricas financeiras e volume de clientes por mes',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardCompleto' } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/calculadora/limites': {
      get: { summary: 'Limites de taxa e parcela' },
    },
    '/calculadora/juros/simples': {
      get: { summary: 'Calculo de juros simples' },
    },
    '/calculadora/juros/compostos': {
      get: { summary: 'Calculo de juros compostos' },
    },
    '/calculadora/price': {
      get: {
        summary: 'Calculo de parcela fixa pela Tabela Price',
        parameters: [
          { name: 'principal', in: 'query', required: true, schema: { type: 'number', example: 10000 } },
          { name: 'taxa', in: 'query', required: true, schema: { type: 'number', example: 0.1 } },
          { name: 'meses', in: 'query', required: true, schema: { type: 'integer', example: 12 } },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    parcela: { type: 'number', example: 1467.63 },
                    total_pago: { type: 'number', example: 17611.56 },
                    juros_total: { type: 'number', example: 7611.56 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/calculadora/risco': {
      get: { summary: 'Calculo de risco por renda' },
    },
  },
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/', healthController);
app.use('/clientes', clientesController);
app.use('/simulacoes', simulacaoController);
app.use('/clientes/:codigoCliente/investimentos', investimentosController.byCliente);
app.use('/investimentos', investimentosController.investimentoCrud);
app.use('/calculadora', calculadoraController);
app.use('/dashboard', dashboardController);

const port = Number(process.env.PORT || 8080);

async function inicializarSchema() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schemaSql);
}

if (process.env.SKIP_LISTEN !== '1') {
  inicializarSchema()
    .then(() => {
      app.listen(port, () => {
        console.log(`Express API listening on http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error(`Falha ao inicializar schema do banco: ${err.message}`);
      process.exit(1);
    });
}

module.exports = app;
