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

## Acesso (login)

- Autenticacao por email/senha em `POST /auth/login`
- Perfis:
	- `ADMIN`: acesso completo + criacao de usuarios
	- `USUARIO`: visualizacao apenas das proprias parcelas/investimentos e dashboard da propria divida
- Admin principal inicial via `.env`:
	- `ADMIN_EMAIL` (padrao `admin@multiplicamoney.local`)
	- `ADMIN_PASSWORD` (padrao `admin123456`)

## Arquitetura e fluxos (Mermaid)

### Visão geral Frontend ↔ Backend

```mermaid
flowchart LR
	U[Usuário]
	F[Frontend estático<br/>Nginx :3000]
	A[API Express<br/>:8080]
	D[(PostgreSQL :5432)]

	U --> F
	F -->|HTTP/JSON| A
	A -->|SQL| D
	D --> A
	A --> F
	F --> U
```

### Fluxo: criar cliente → endereço → investimento

```mermaid
sequenceDiagram
	actor U as Usuário
	participant F as Frontend
	participant A as API Express
	participant DB as PostgreSQL

	U->>F: Preenche cadastro
	F->>A: POST /clientes
	A->>DB: INSERT clientes
	DB-->>A: cliente(id)
	A-->>F: 201 cliente

	F->>A: POST /clientes/{id}/enderecos
	A->>DB: INSERT enderecos
	DB-->>A: endereco
	A-->>F: 201 endereco

	F->>A: POST /investimentos
	A->>DB: INSERT investimentos + parcelas
	DB-->>A: investimento criado
	A-->>F: 201 investimento

	F->>A: GET /dashboard/resumo
	A->>DB: SELECT agregados
	DB-->>A: métricas
	A-->>F: 200 resumo
```

### Fluxo: pagamento e prorrogação de parcela

```mermaid
sequenceDiagram
	actor U as Usuário
	participant F as Frontend
	participant A as API Express
	participant DB as PostgreSQL

	U->>F: Seleciona parcela e paga
	F->>A: POST /investimentos/pagamentos
	A->>DB: INSERT pagamentos + UPDATE saldo/status
	DB-->>A: confirmação
	A-->>F: 201 pagamento

	U->>F: Solicita prorrogação
	F->>A: POST /investimentos/parcelas/prorrogacoes
	A->>DB: INSERT prorrogações + UPDATE vencimento/juros
	DB-->>A: parcela atualizada
	A-->>F: 200 prorrogação

	F->>A: GET /investimentos/{id}/parcelas
	A->>DB: SELECT parcelas
	DB-->>A: cronograma atualizado
	A-->>F: 200 parcelas
```

## Visual do app

<p align="center">
	<img src="docs/screenshots/ux-flow.svg" alt="Demonstração de usabilidade do MultiplicaMoney" width="980" />
	<br />
	<sub>Fluxo completo: cadastro → simulação → formalização → investimento overview → dashboard.</sub>
</p>

<table>
	<tr>
		<td align="center">
			<img src="docs/screenshots/clientes.svg" alt="Tela de clientes" width="480" />
			<br />
			<sub>Clientes</sub>
		</td>
		<td align="center">
			<img src="docs/screenshots/simulacao.svg" alt="Tela de simulação" width="480" />
			<br />
			<sub>Simulação</sub>
		</td>
	</tr>
	<tr>
		<td align="center">
			<img src="docs/screenshots/investimentos.svg" alt="Tela de investimentos" width="480" />
			<br />
			<sub>Investimentos</sub>
		</td>
		<td align="center">
			<img src="docs/screenshots/dashboard.svg" alt="Tela de dashboard completo" width="480" />
			<br />
			<sub>Dashboard Completo</sub>
		</td>
	</tr>
</table>

> Dica: mantenha o GIF em até 12–20 segundos para carregar rápido no GitHub.
