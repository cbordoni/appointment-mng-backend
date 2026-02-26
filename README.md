# Appointment Management Backend

Backend para gerenciamento de agendamentos, construído com **Bun**, **Elysia**, **TypeScript**, **Drizzle ORM** e **Redis/BullMQ**.

## Stack

- Runtime: Bun
- Framework HTTP: Elysia
- Banco de dados: PostgreSQL (Drizzle ORM)
- Fila: Redis + BullMQ
- Documentação da API: OpenAPI (`/docs`)
- Qualidade de código: Biome

## Pré-requisitos

- Bun instalado
- Docker e Docker Compose disponíveis

## Configuração de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Variáveis mínimas:

```dotenv
DATABASE_URL=postgres://postgres:postgres@localhost:5432/appointment_db
REDIS_HOST=localhost
REDIS_PORT=6379
```

Variáveis opcionais:

- `PORT` (padrão: `3000`)
- `DB_SYNC` (`true` para rodar migrations ao iniciar a aplicação)

## Subindo infraestrutura local (Postgres + Redis)

```bash
docker compose up -d postgres redis
```

Para derrubar os serviços:

```bash
docker compose down
```

## Instalação e execução (modo desenvolvimento)

Instale as dependências:

```bash
bun install
```

Rode migrations:

```bash
bun run db:migrate
```

Inicie a API:

```bash
bun run dev
```

Aplicação disponível em:

- API: `http://localhost:3000`
- OpenAPI: `http://localhost:3000/docs`

## Execução com Docker Compose (stack completa)

Se quiser rodar também o backend em container:

```bash
docker compose up -d
```

Nesse modo, o serviço `backend` usa o arquivo `.env.development.local` (conforme `docker-compose.yml`).

## Banco de dados

Comandos disponíveis:

```bash
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio
bun run db:seed
```

## Qualidade de código

```bash
bun run lint
bun run format
bun run check
```

## Endpoints principais

- `GET /` - root da API
- `GET /health` - health check da API e banco
- `GET /users` - listagem paginada de usuários
- `POST /users` - criação de usuário
- `GET /appointments` - listagem de agendamentos por intervalo de data
- `POST /appointments` - criação de agendamento

Para detalhes de payload, params e responses, consulte `/docs`.

## Estrutura do projeto (resumo)

```text
src/
├── app.ts
├── index.ts
├── common/
├── db/
└── features/
	├── health/
	├── user/
	└── appointment/
```

Padrão arquitetural utilizado:

- `routes/controller`: camada HTTP e mapeamento de resposta
- `service`: regras de negócio
- `repository`: acesso a dados