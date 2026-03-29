# Authentication Feature

Responsável pela autenticação de usuários (contas) através de taxId e senha.

## Responsabilidades

- Autenticar usuários com taxId e senha
- Validar credenciais contra a base de dados
- Retornar informações de autenticação bem-sucedida

## Componentes

- **Controller**: Mapeia requisições HTTP para a lógica de autenticação
- **Service**: Orquestra a lógica de autenticação e validações
- **Repository**: Acessa a base de dados para buscar contas por taxId
- **Routes**: Define os endpoints HTTP da feature

## Endpoints

Prefixo: `/auth`

### POST /auth/login

Autentica um usuário com taxId e senha.

**Body**:
```json
{
  "taxId": "string (9-15 caracteres)",
  "password": "string (mínimo 8 caracteres)"
}
```

**Success Response (200)**:
```json
{
  "data": {
    "accountId": "uuid",
    "taxId": "string",
    "name": "string"
  }
}
```

**Error Response (400/422)**:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid credentials | Password must be at least 8 characters | TaxId cannot be empty"
}
```

## Fluxo de Autenticação

1. Cliente envia POST `/auth/login` com taxId e password
2. Controller valida o schema de entrada (TypeBox)
3. Service realiza validações adicionais
4. Repository busca a conta pelo taxId
5. Service verifica a senha usando `Bun.password.verify()`
6. Se bem-sucedido, retorna payload de autenticação (accountId, taxId, name)
7. Se falha, retorna erro de validação genérico "Invalid credentials"

## Observações de Segurança

- Senhas nunca são retornadas nas respostas
- Mensagens de erro genéricas para taxId/senha inválidos (não revela qual campo está errado)
- Contra-medidas: hash de senha com `Bun.password` (ARGON2ID)
- A feature não gerencia sessões ou JWT - isso pode ser implementado em um middleware posterior
