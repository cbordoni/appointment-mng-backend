# Appointment Feature

Responsável pelo ciclo de vida de agendamentos.

## Responsabilidades

- Criar, consultar, atualizar e remover agendamentos
- Listar agendamentos por intervalo de datas
- Listar agendamentos por cliente com paginação
- Orquestrar agendamento de notificações

## Endpoints

Prefixo: `/appointments`

- `GET /appointments`
  - Query:
    - `from` (opcional, `date-time`)
    - `to` (opcional, `date-time`)
  - Descrição: lista agendamentos por intervalo de datas

- `GET /appointments/client/:clientId`
  - Params:
    - `clientId` (UUID)
  - Query:
    - `page` (opcional, padrão: `1`)
    - `limit` (opcional, padrão: `10`)
  - Descrição: lista agendamentos de um cliente com paginação

- `GET /appointments/:id`
  - Params:
    - `id` (UUID)
  - Descrição: busca agendamento por ID

- `POST /appointments`
  - Body:

```json
{
  "summary": "Consulta",
  "startDate": "2026-03-02T10:00:00.000Z",
  "endDate": "2026-03-02T11:00:00.000Z",
  "rrule": "FREQ=WEEKLY;BYDAY=MO",
  "active": true,
  "observation": "Levar exames",
  "clientId": "00000000-0000-0000-0000-000000000000",
  "professionalId": "00000000-0000-0000-0000-000000000000"
}
```

  - `rrule` (opcional): string no formato RFC 5545 (`FREQ=...;...`)

- `PATCH /appointments/:id`
  - Params:
    - `id` (UUID)
  - Body (todos opcionais):

```json
{
  "summary": "Consulta de retorno",
  "startDate": "2026-03-09T10:00:00.000Z",
  "endDate": "2026-03-09T11:00:00.000Z",
  "rrule": "FREQ=MONTHLY;BYMONTHDAY=9",
  "active": false,
  "observation": null,
  "professionalId": "00000000-0000-0000-0000-000000000000"
}
```

- `DELETE /appointments/:id`
  - Params:
    - `id` (UUID)
  - Descrição: realiza exclusão lógica (soft delete), marcando o registro como deletado

## Estrutura da feature

- `appointment.routes.ts`: definição de rotas Elysia
- `index.ts`: composição de dependências da feature (repository, scheduler e controller)
- `appointment.controller.ts`: mapeamento HTTP para operações CRUD
- `appointment.service.ts`: regras de negócio de agendamentos
- `appointment.repository.ts`: acesso ao banco
- `appointment.repository.interface.ts`: contrato de repositório
- `appointment.repository.mock.ts`: mock para testes
- `appointment.types.ts`: schemas e tipos de entrada

## Integração com scheduler

- A orquestração de notificações foi extraída para `src/features/scheduler`
- `appointment.service.ts` depende do contrato `IScheduler` para `schedule`, `reschedule` e `clear`
- O worker BullMQ é iniciado pela aplicação em `src/index.ts`

## Testes

- `appointment.service.test.ts`
