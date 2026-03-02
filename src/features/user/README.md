# User Feature

Responsável pelo ciclo de vida de usuários (CRUD) com paginação na listagem.

## Responsabilidades

- Criar usuário
- Buscar usuário por ID
- Listar usuários com paginação
- Atualizar usuário
- Remover usuário

## Endpoints

Prefixo: `/users`

- `GET /users`
  - Query:
    - `page` (opcional, padrão: `1`)
    - `limit` (opcional, padrão: `10`)
  - Descrição: lista usuários com paginação

- `GET /users/:id`
  - Params:
    - `id` (UUID)
  - Descrição: busca usuário por ID

- `POST /users`
  - Body:

```json
{
  "name": "Nome",
  "email": "user@email.com",
  "cellphone": "11999999999",
  "role": "admin"
}
```

  - `role`: `admin | customer`

- `PATCH /users/:id`
  - Params:
    - `id` (UUID)
  - Body (todos opcionais):

```json
{
  "name": "Novo nome",
  "email": "novo@email.com",
  "cellphone": "11999999999",
  "role": "customer"
}
```

- `DELETE /users/:id`
  - Params:
    - `id` (UUID)

## Respostas HTTP

- Endpoints de leitura e escrita retornam payload no formato `{ data: ... }`
- `POST /users` retorna `201`
- `DELETE /users/:id` retorna `204`

## Estrutura da feature

- `user.routes.ts`: definição de rotas Elysia
- `user.controller.ts`: mapeamento `Result` para resposta HTTP
- `user.service.ts`: regras de negócio de usuários
- `user.repository.ts`: acesso ao banco
- `user.repository.interface.ts`: contrato de repositório
- `user.repository.mock.ts`: mock para testes
- `user.types.ts`: schemas e tipos de entrada

## Testes

- `user.service.test.ts`
