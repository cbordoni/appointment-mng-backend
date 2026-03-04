# Appointment Override Feature

Responsável pelo ciclo de vida de sobrescritas de recorrência (`RECURRENCE-ID`) dos agendamentos.

## Responsabilidades

- Criar override de recorrência
- Buscar override por ID
- Listar overrides com paginação
- Atualizar override
- Remover override
- Consultar e substituir overrides por `appointmentId` (uso interno)

## Endpoints

Prefixo: `/appointment-overrides`

- `GET /appointment-overrides`
  - Query:
    - `page` (opcional, padrão: `1`)
    - `limit` (opcional, padrão: `10`)
  - Descrição: lista overrides com paginação

- `GET /appointment-overrides/:id`
  - Params:
    - `id` (UUID)
  - Descrição: busca override por ID

- `POST /appointment-overrides`
  - Body:

```json
{
  "appointmentId": "00000000-0000-0000-0000-000000000000",
  "recurrenceId": "2026-03-23T10:00:00.000Z",
  "summary": "Consulta (horário ajustado)",
  "dtstart": "2026-03-23T11:00:00.000Z",
  "dtend": "2026-03-23T12:00:00.000Z",
  "status": "CONFIRMED"
}
```

- `PATCH /appointment-overrides/:id`
  - Params:
    - `id` (UUID)
  - Body (todos opcionais):

```json
{
  "summary": "Consulta de retorno (ajustada)",
  "dtstart": "2026-03-23T11:30:00.000Z",
  "dtend": "2026-03-23T12:30:00.000Z",
  "sequence": 2
}
```

- `DELETE /appointment-overrides/:id`
  - Params:
    - `id` (UUID)

## Respostas HTTP

- Endpoints de leitura e escrita retornam payload no formato `{ data: ... }`
- `POST /appointment-overrides` retorna `201`
- `DELETE /appointment-overrides/:id` retorna `204`

## Estrutura da feature

- `appointment-override.routes.ts`: definição de rotas Elysia
- `appointment-override.controller.ts`: mapeamento `Result` para resposta HTTP
- `appointment-override.service.ts`: validações e regras de negócio
- `appointment-override.repository.ts`: acesso ao banco
- `appointment-override.repository.interface.ts`: contrato de repositório
- `appointment-override.types.ts`: schemas e tipos de entrada

## Testes

- `appointment-override.service.test.ts`
