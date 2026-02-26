# Appointment Management Backend

Projeto de gerenciamento de agendamentos com Bun + Elysia.

## Pré-requisitos

- Bun instalado
- Docker e Docker Compose disponíveis

## Inicialização do ambiente com Docker Compose

Suba os serviços de infraestrutura (Postgres e Redis):

```bash
docker compose up -d
```

Para parar os serviços:

```bash
docker compose down
```

## Instalação e execução da API

Instale as dependências:

```bash
bun install
```

Inicie a aplicação em desenvolvimento:

```bash
bun run dev
```

A API ficará disponível em `http://localhost:3000`.

## Banco de dados e migrations

Com o Postgres já iniciado via Docker Compose, execute as migrations:

```bash
bun run db:migrate
```

Se quiser popular o banco com dados iniciais:

```bash
bun run db:seed
```

Comandos úteis de banco:

```bash
bun run db:generate
bun run db:push
bun run db:studio
```

## OpenAPI (`/docs`)

A documentação OpenAPI/Swagger da API fica disponível em:

- `http://localhost:3000/docs`

Use essa rota para visualizar os endpoints, payloads e respostas esperadas de forma interativa.