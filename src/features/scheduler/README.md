# Scheduler Feature

Responsável pelo agendamento e gerenciamento de jobs de notificação de agendamentos via BullMQ.

## Responsabilidades

- Criar conexão com Redis para fila de notificações
- Agendar notificações por janelas configuradas
- Reagendar notificações após atualização de agendamento
- Limpar jobs ao remover agendamento
- Expor worker para processamento dos jobs

## Contrato

A feature expõe a interface `IScheduler` com as operações:

- `schedule(input)`
- `reschedule(input)`
- `clear(id)`

## Estrutura da feature

- `scheduler.constants.ts`: constantes da fila, janelas de notificação e fábrica de conexão Redis
- `scheduler.types.ts`: tipos de entrada, janela e payload dos jobs
- `scheduler.interface.ts`: contrato de scheduler utilizado pelas features consumidoras
- `scheduler.service.ts`: implementação `SchedulerService` com integração BullMQ
- `worker.ts`: worker de processamento e tratamento de erros

## Integração com outras features

- A feature `appointment` injeta `SchedulerService` em `AppointmentService` via `IScheduler`
- O worker é inicializado no bootstrap da aplicação em `src/index.ts`
