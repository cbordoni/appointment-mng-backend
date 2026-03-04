# Appointment Exception Feature

Responsável pelo ciclo de vida de exceções de recorrência (`EXDATE`) dos agendamentos.

## Responsabilidades

- Criar exceção de recorrência
- Buscar exceção por ID
- Listar exceções com paginação
- Atualizar exceção
- Remover exceção
- Consultar e substituir exceções por `appointmentId` (uso interno)

## Endpoints

Prefixo: `/appointment-exceptions`

- `GET /appointment-exceptions`
  - Query:
    - `page` (opcional, padrão: `1`)
    - `limit` (opcional, padrão: `10`)
  - Descrição: lista exceções com paginação

- `GET /appointment-exceptions/:id`
  - Params:
    - `id` (UUID)
  - Descrição: busca exceção por ID

- `POST /appointment-exceptions`
  - Body:

```json
{
  "appointmentId": "00000000-0000-0000-0000-000000000000",
  "exdate": "2026-03-16T10:00:00.000Z"
}
```

- `PATCH /appointment-exceptions/:id`
  - Params:
    - `id` (UUID)
  - Body (todos opcionais):

```json
{
  "appointmentId": "00000000-0000-0000-0000-000000000000",
  "exdate": "2026-03-23T10:00:00.000Z"
}
```

- `DELETE /appointment-exceptions/:id`
  - Params:
    - `id` (UUID)

## Respostas HTTP

- Endpoints de leitura e escrita retornam payload no formato `{ data: ... }`
- `POST /appointment-exceptions` retorna `201`
- `DELETE /appointment-exceptions/:id` retorna `204`

## Estrutura da feature

- `appointment-exception.routes.ts`: definição de rotas Elysia
- `appointment-exception.controller.ts`: mapeamento `Result` para resposta HTTP
- `appointment-exception.service.ts`: validações e regras de negócio
- `appointment-exception.repository.ts`: acesso ao banco
- `appointment-exception.repository.interface.ts`: contrato de repositório
- `appointment-exception.types.ts`: schemas e tipos de entrada

## Testes

- `appointment-exception.service.test.ts`
