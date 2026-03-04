# Client Feature

Responsável pelo ciclo de vida de clientes (CRUD) com paginação na listagem.

## Responsabilidades

- Criar cliente
- Buscar cliente por ID
- Listar clientes com paginação
- Atualizar cliente
- Remover cliente

## Endpoints

Prefixo: `/clients`

- `GET /clients`
  - Query:
    - `page` (opcional, padrão: `1`)
    - `limit` (opcional, padrão: `10`)
  - Descrição: lista clientes com paginação

- `GET /clients/:id`
  - Params:
    - `id` (UUID)
  - Descrição: busca cliente por ID

- `POST /clients`
  - Body:

```json
{
  "name": "Nome",
  "email": "client@email.com",
  "cellphone": "11999999999",
}
```

- `PATCH /clients/:id`
  - Params:
    - `id` (UUID)
  - Body (todos opcionais):

```json
{
  "name": "Novo nome",
  "email": "novo@email.com",
  "cellphone": "11999999999",
}
```

- `DELETE /clients/:id`
  - Params:
    - `id` (UUID)

## Respostas HTTP

- Endpoints de leitura e escrita retornam payload no formato `{ data: ... }`
- `POST /clients` retorna `201`
- `DELETE /clients/:id` retorna `204`

## Estrutura da feature

- `client.routes.ts`: definição de rotas Elysia
- `client.controller.ts`: mapeamento `Result` para resposta HTTP
- `client.service.ts`: regras de negócio de clientes
- `client.repository.ts`: acesso ao banco
- `client.repository.interface.ts`: contrato de repositório
- `client.repository.mock.ts`: mock para testes
- `client.types.ts`: schemas e tipos de entrada

## Testes

- `client.service.test.ts`
