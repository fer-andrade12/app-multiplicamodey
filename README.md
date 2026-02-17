# MultiplicaMoney

Projeto MultiplicaMoney com backend, frontend estático e frontend React.

## Descrição do sistema

O MultiplicaMoney é um sistema de gestão de clientes e investimentos, focado em simulação, contratação e acompanhamento financeiro. A plataforma permite cadastrar clientes e endereços, simular cenários de investimento com cálculo de juros simples e compostos, formalizar investimentos com parcelamento, registrar pagamentos e prorrogações, além de consolidar indicadores em um dashboard resumido para apoio à decisão.

De forma prática, o sistema cobre o ciclo completo da operação:
- cadastro e organização de dados do cliente;
- análise prévia por simulações e calculadoras financeiras;
- criação e acompanhamento de investimentos ativos;
- controle de parcelas, pagamentos e saldo devedor;
- visão executiva de resultados via endpoints de resumo.

## Estrutura

- `backend-express/` API Node.js + PostgreSQL
- `frontend/` interface web estática
- `frontend-react/` interface React

## Como executar (stack Docker)

Na pasta `backend-express`:

```bash
docker compose up -d --build
```

## Serviços

- API: `http://localhost:8080`
- Frontend: `http://localhost:3000`
- Swagger: `http://localhost:8080/docs`
