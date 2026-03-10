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
  "uid": "consult-001@clinic.local",
  "summary": "Consulta",
  "description": "Levar exames",
  "dtStart": "2026-03-02T10:00:00.000Z",
  "dtEnd": "2026-03-02T11:00:00.000Z",
  "timezone": "America/Sao_Paulo",
  "rrule": "FREQ=WEEKLY;BYDAY=MO",
  "status": "CONFIRMED",
  "sequence": 0,
  "clientId": "00000000-0000-0000-0000-000000000000",
  "professionalId": "00000000-0000-0000-0000-000000000000"
}
```

  - `rrule` (opcional): string no formato RFC 5545 (`FREQ=...;...`)
  - Exceções e overrides de recorrência são gerenciados em features específicas (`appointment-exception` e `appointment-override`), não no CRUD base de `appointment`

- `PATCH /appointments/:id`
  - Params:
    - `id` (UUID)
  - Body (todos opcionais):

```json
{
  "summary": "Consulta de retorno",
  "dtStart": "2026-03-09T10:00:00.000Z",
  "dtEnd": "2026-03-09T11:00:00.000Z",
  "rrule": "FREQ=MONTHLY;BYMONTHDAY=9",
  "status": "TENTATIVE",
  "description": null,
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

## Features relacionadas

- Exceções de recorrência (`EXDATE`): `src/features/appointment-exception`
- Overrides de recorrência (`RECURRENCE-ID`): `src/features/appointment-override`

## Integração com scheduler

- A orquestração de notificações foi extraída para `src/features/scheduler`
- `appointment.service.ts` depende do contrato `IScheduler` para `schedule`, `reschedule` e `clear`
- O worker BullMQ é iniciado pela aplicação em `src/index.ts`

## Testes

- `appointment.service.test.ts`
