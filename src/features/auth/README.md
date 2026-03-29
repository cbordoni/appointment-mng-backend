# Authentication Feature

Provides JWT-based session authentication for the API. Authenticates users via taxId and password, issuing JWT tokens for accessing protected routes.

## Responsibilities

- Authenticate users with taxId and password
- Generate JWT tokens on successful login
- Validate credentials against the database
- Return authentication information with JWT token

## Components

- **Controller**: Maps HTTP requests to authentication logic
- **Service**: Orchestrates authentication logic, JWT generation, and validations
- **Repository**: Accesses database to find accounts by taxId
- **Routes**: Defines HTTP endpoints for the feature
- **JWT Service**: Handles JWT token signing and verification
- **Auth Middleware**: Protects routes requiring authentication

## Endpoints

Prefix: `/auth`

### POST /auth/login

Authenticates a user with taxId and password, returning a JWT token.

**Body**:
```json
{
  "taxId": "string (9-15 characters)",
  "password": "string (minimum 8 characters)"
}
```

**Success Response (200)**:
```json
{
  "data": {
    "accountId": "uuid",
    "taxId": "string",
    "name": "string",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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

## Authentication Flow

1. Client sends POST `/auth/login` with taxId and password
2. Controller validates the input schema (TypeBox)
3. Service performs additional validations
4. Repository finds the account by taxId
5. Service verifies the password using `Bun.password.verify()`
6. If successful:
   - JWT Service generates a token with 7-day expiration
   - Returns payload with accountId, taxId, name, and token
7. If failed, returns generic "Invalid credentials" error

## Protected Routes

All routes except `/auth/login` require a valid JWT token in the `Authorization` header.

### Usage Example

```bash
# Get token from login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"taxId": "12345678901", "password": "password123"}'

# Use token to access protected routes
curl -X GET http://localhost:3000/accounts \
  -H "Authorization: Bearer <token>"
```

## JWT Token Details

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 7 days (604,800 seconds)
- **Payload**:
  ```json
  {
    "accountId": "string",
    "taxId": "string",
    "name": "string",
    "iat": number,
    "exp": number
  }
  ```

## Security Notes

- Passwords are never returned in responses
- Generic error messages for invalid taxId/password (doesn't reveal which field is wrong)
- Password hashing with `Bun.password` (ARGON2ID)
- JWT tokens signed with configurable secret (JWT_SECRET env var)
- Default development secret provided for testing (change in production)
- Token verification on every protected request

## Environment Variables

- `JWT_SECRET` (optional): Secret key for signing tokens
  - Default: "dev-secret-key-change-in-production"
  - **Important**: Set this to a strong value in production
