# Appointment Feature

Responsável pelo ciclo de vida de agendamentos, projeções de recorrência e histórico de eventos.

## Responsabilidades

- Criar, consultar, atualizar e remover agendamentos
- Listar agendamentos por intervalo de datas
- Listar agendamentos por usuário com paginação
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

- `GET /appointments/user/:userId`
  - Params:
    - `userId` (UUID)
  - Query:
    - `page` (opcional, padrão: `1`)
    - `limit` (opcional, padrão: `10`)
  - Descrição: lista agendamentos de um usuário com paginação

- `GET /appointments/projections`
  - Query:
    - `from` (opcional, `date-time`)
    - `to` (opcional, `date-time`)
  - Descrição: retorna projeções de agendamentos recorrentes no intervalo

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
  "userId": "00000000-0000-0000-0000-000000000000"
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
  "observation": null
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
  "performedByUserId": "00000000-0000-0000-0000-000000000000",
  "newAppointmentId": "00000000-0000-0000-0000-000000000000"
}
```

  - `status`: `completed | cancelled | rescheduled`

## Estrutura da feature

- `appointment.routes.ts`: definição de rotas Elysia
- `crud/appointment.crud.controller.ts`: mapeamento HTTP para operações CRUD
- `projection/appointment.projection.controller.ts`: mapeamento HTTP para projeções e calendário
- `scheduling/appointment.scheduling.controller.ts`: mapeamento HTTP para eventos e histórico
- `appointment.service.ts`: regras de negócio de agendamentos
- `appointment.repository.ts`: acesso ao banco
- `appointment.repository.interface.ts`: contrato de repositório
- `appointment.repository.mock.ts`: mock para testes
- `notification/appointment.notification.scheduler.ts`: integração com BullMQ para notificações
- `notification/appointment.notification.scheduler.interface.ts`: contrato do scheduler
- `appointment.types.ts`: schemas e tipos de entrada

## Testes

- `appointment.service.test.ts`
