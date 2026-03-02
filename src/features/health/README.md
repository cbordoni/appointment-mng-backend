# Health Feature

Responsável por expor o estado de saúde da aplicação e do banco de dados.

## Responsabilidades

- Verificar conectividade com banco de dados
- Medir latência da verificação
- Retornar status consolidado da API

## Endpoints

Prefixo: `/health`

- `GET /health/`
  - Descrição: health check da API e do banco
  - Response de sucesso (`200`):

```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "latency": 12
  },
  "timestamp": "2026-03-02T12:00:00.000Z"
}
```

## Estrutura da feature

- `health.routes.ts`: definição de rotas Elysia
- `health.controller.ts`: mapeamento `Result` para resposta HTTP
- `health.service.ts`: regra de negócio de health check
- `health.repository.ts`: acesso ao banco para validar conexão
- `health.repository.interface.ts`: contrato de repositório
- `health.repository.mock.ts`: mock para testes
- `health.types.ts`: tipos de domínio da feature

## Testes

- `health.service.test.ts`
