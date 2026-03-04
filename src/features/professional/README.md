# Professional Feature

Responsável pelo ciclo de vida de profissionais (CRUD) com paginação na listagem.

## Responsabilidades

- Criar profissional
- Buscar profissional por ID
- Listar profissionais com paginação
- Atualizar profissional
- Remover profissional

## Endpoints

Prefixo: `/professionals`

- `GET /professionals`
  - Query:
    - `page` (opcional, padrão: `1`)
    - `limit` (opcional, padrão: `10`)
  - Descrição: lista profissionais com paginação

- `GET /professionals/:id`
  - Params:
    - `id` (UUID)
  - Descrição: busca profissional por ID

- `POST /professionals`
  - Body:

```json
{
  "name": "Nome",
  "taxId": "12345678901",
  "phone": "11999999999"
}
```

- `PATCH /professionals/:id`
  - Params:
    - `id` (UUID)
  - Body (todos opcionais):

```json
{
  "name": "Novo nome",
  "taxId": "12345678901",
  "phone": "11999999999"
}
```

- `DELETE /professionals/:id`
  - Params:
    - `id` (UUID)

## Respostas HTTP

- Endpoints de leitura e escrita retornam payload no formato `{ data: ... }`
- `POST /professionals` retorna `201`
- `DELETE /professionals/:id` retorna `204`

## Estrutura da feature

- `professional.routes.ts`: definição de rotas Elysia
- `professional.controller.ts`: mapeamento `Result` para resposta HTTP
- `professional.service.ts`: regras de negócio de profissionais
- `professional.repository.ts`: acesso ao banco
- `professional.repository.interface.ts`: contrato de repositório
- `professional.repository.mock.ts`: mock para testes
- `professional.types.ts`: schemas e tipos de entrada

## Testes

- `professional.service.test.ts`
