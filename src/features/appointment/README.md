# Appointment Feature

Responsável pelo ciclo de vida de agendamentos, projeções de recorrência e histórico de eventos.

## Responsabilidades

- Criar, consultar, atualizar e remover agendamentos
- Listar agendamentos por intervalo de datas
- Listar agendamentos por cliente com paginação
- Projetar ocorrências de agendamentos recorrentes
- Registrar e consultar eventos de histórico de agendamento
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

- `GET /appointments/projections`
  - Query:
    - `from` (opcional, `date-time`)
    - `to` (opcional, `date-time`)
  - Descrição: retorna projeções de agendamentos recorrentes no intervalo

- `GET /appointments/calendar`
  - Query:
    - `from` (opcional, `date-time`)
    - `to` (opcional, `date-time`)
  - Descrição: retorna calendário combinando agendamentos não recorrentes e projeções recorrentes

- `GET /appointments/:id`
  - Params:
    - `id` (UUID)
  - Descrição: busca agendamento por ID

- `POST /appointments`
  - Body:

```json
{
  "title": "Consulta",
  "startDate": "2026-03-02T10:00:00.000Z",
  "endDate": "2026-03-02T11:00:00.000Z",
  "recurrence": "weekly",
  "active": true,
  "observation": "Levar exames",
  "clientId": "00000000-0000-0000-0000-000000000000",
  "professionalId": "00000000-0000-0000-0000-000000000000"
}
```

  - `recurrence`: `none | weekly | monthly`

- `PATCH /appointments/:id`
  - Params:
    - `id` (UUID)
  - Body (todos opcionais):

```json
{
  "title": "Consulta de retorno",
  "startDate": "2026-03-09T10:00:00.000Z",
  "endDate": "2026-03-09T11:00:00.000Z",
  "recurrence": "monthly",
  "active": false,
  "observation": null,
  "professionalId": "00000000-0000-0000-0000-000000000000"
}
```

- `DELETE /appointments/:id`
  - Params:
    - `id` (UUID)
  - Descrição: realiza exclusão lógica (soft delete), marcando o registro como deletado

- `GET /appointments/:id/events`
  - Params:
    - `id` (UUID)
  - Descrição: lista histórico de eventos do agendamento

- `POST /appointments/:id/events`
  - Params:
    - `id` (UUID)
  - Body:

```json
{
  "status": "rescheduled",
  "actualStartDate": "2026-03-02T10:05:00.000Z",
  "actualEndDate": "2026-03-02T11:05:00.000Z",
  "performedByClientId": "00000000-0000-0000-0000-000000000000",
  "newAppointmentId": "00000000-0000-0000-0000-000000000000"
}
```

  - `status`: `completed | cancelled | rescheduled`

## Estrutura da feature

- `appointment.routes.ts`: definição de rotas Elysia
- `index.ts`: composição de dependências da feature (repository, scheduler e controller)
- `appointment.controller.ts`: mapeamento HTTP para operações CRUD
- `appointment.service.ts`: regras de negócio de agendamentos
- `appointment.repository.ts`: acesso ao banco
- `appointment.repository.interface.ts`: contrato de repositório
- `appointment.repository.mock.ts`: mock para testes
- `appointment.types.ts`: schemas e tipos de entrada
- `event/`
  - `event.routes.ts`: rotas de histórico de eventos
  - `event.controller.ts`: mapeamento HTTP para eventos
  - `event.service.ts`: regras de negócio de eventos de agendamento
  - `index.ts`: composição interna do módulo de eventos
- `projection/`
  - `projection.routes.ts`: rotas de projeções e calendário
  - `projection.controller.ts`: mapeamento HTTP para projeções
  - `projection.service.ts`: regras de negócio de projeções recorrentes
  - `index.ts`: composição interna do módulo de projeções

## Integração com scheduler

- A orquestração de notificações foi extraída para `src/features/scheduler`
- `appointment.service.ts` depende do contrato `IScheduler` para `schedule`, `reschedule` e `clear`
- O worker BullMQ é iniciado pela aplicação em `src/index.ts`

## Testes

- `appointment.service.test.ts`
