# AGENTS.md

Este documento define as regras e padrões que **todos os agentes (humanos ou IA)** devem seguir ao criar, modificar ou revisar código nesta aplicação.

---

## Stack

- **Runtime**: Bun
- **Framework HTTP**: Elysia
- **Linguagem**: TypeScript
- **Lint/Formatter**: BiomeJS
- **Error Handling**: Result Pattern com `neverthrow`

---

## Princípios Gerais

1. **Responsabilidade Única**
   Cada arquivo, função ou classe deve ter apenas uma responsabilidade clara.

2. **Feature-Based Structure**
   O código deve ser organizado por _feature_ (domínio funcional), não por tipo técnico.

3. **Código Previsível e Testável**
   Evite efeitos colaterais ocultos. Prefira funções puras sempre que possível.

4. **Sem lógica de negócio em camadas externas**
   Controllers, handlers HTTP e adapters não devem conter regras de negócio.

---

## Estrutura de Pastas

```text
src/
├── features/
│   ├── user/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   ├── user.routes.ts
│   │   └── user.types.ts
│   └── auth/
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       └── auth.routes.ts
│
├── shared/
│   ├── config/
│   ├── errors/
│   ├── http/
│   ├── logger/
│   ├── utils/
│   └── types/
│
├── app.ts
└── server.ts
```

### Regras

- Tudo que **pode ser reutilizado** entre features **DEVE** ficar em `shared`
- Uma feature **não deve importar diretamente** arquivos de outra feature
- Comunicação entre features ocorre via serviços ou contratos bem definidos
- Uma feature **não deve acessar diretamente** tabelas de outras features. Sempre use contratos de repositórios
- Sempre desenvolva mantendo os princípios SOLID e DRY

---

## Result Pattern (neverthrow)

### Regra Obrigatória

- **Nunca** lançar erros (`throw`) em lógica de negócio
- **Sempre** retornar `Result<T, E>` ou `ResultAsync<T, E>`

### Exemplo

```ts
import { ok, err, Result } from "neverthrow";

function createUser(input: CreateUserInput): Result<User, DomainError> {
  if (!input.email) {
    return err(new DomainError("Email obrigatório"));
  }

  return ok({ id: crypto.randomUUID(), email: input.email });
}
```

### Controllers / Handlers HTTP

- Devem **mapear Result → HTTP response**
- Nunca conter regras de negócio

---

## Separação de Camadas

### Controller / Route

- Recebe request
- Valida input (schema)
- Chama service
- Converte `Result` em resposta HTTP

### Service

- Contém regras de negócio
- Orquestra chamadas
- Retorna `Result`

### Repository

- Acesso a dados (DB, APIs externas, etc.)
- Nenhuma regra de negócio

---

## Elysia

### Validações com TypeBox

- **Obrigatório** usar `@elysiajs/typebox` para validação de input
- Toda rota HTTP deve possuir schema explícito (`body`, `query`, `params`)
- Validações **não** devem ficar dentro de services

```ts
import { t } from "elysia";

app.post("/users", handler, {
  body: t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 8 }),
  }),
});
```

Schemas podem ser:

- Definidos localmente na feature

- Ou compartilhados via `shared/types` quando reutilizáveis

- Cada feature deve expor suas próprias rotas

- `app.ts` apenas registra plugins e rotas

```ts
app.use(userRoutes);
app.use(authRoutes);
```

---

## BiomeJS

### Regras Obrigatórias

- **Nunca** desabilitar regras do Biome sem justificativa clara
- Código **deve passar** em `biome lint` e `biome format`
- Imports organizados automaticamente
- Sem variáveis não utilizadas

### Estilo

- Nomes claros e explícitos
- Evitar comentários óbvios
- Preferir `type` ao invés de `interface` quando possível

---

## Proibições

- ❌ `throw new Error()` em lógica de negócio
- ❌ Código compartilhado fora de `shared`
- ❌ Features acessando diretamente outras features
- ❌ Controllers com regra de negócio
- ❌ Ignorar regras do BiomeJS

---

## Typescript

- Sempre usar recursos mais novos e avançados disponíveis
- Usar preferencialmente path aliases
- Sempre adicionar uma nova linha em branco após um if statement
- Sempre separar imports do projeto com dependências
- Classes que implementam interfaces ou extendem outras classes não precisam ter seus métodos herdados com explícito tipo de retorno
- Sempre inserir linhas em branco entre blocos lógicos de código para melhorar legibilidade e manutenção.
- É obrigatório haver uma linha em branco entre:
- Importações e qualquer outro tipo de statement
- Declarações de variáveis (const, let, var) e:
- Estruturas de controle (if, for, while, switch, try/catch)
- Retornos (return, throw)
- Blocos de função/método e o próximo statement
- Statements consecutivos de tipos diferentes
- Nunca remover linhas em branco exigidas pelas regras do BiomeJS.
- O código gerado não pode depender de autofix posterior para atender essa regra.

```ts
import {} from "bun";

// Empty line

import {} from "@/feature";
```

---

## Objetivo

Manter um código:

- Legível
- Escalável
- Testável
- Consistente
- Fácil de evoluir com múltiplos agentes trabalhando juntos

Qualquer mudança que viole estas regras deve ser refatorada antes de ser aceita.
