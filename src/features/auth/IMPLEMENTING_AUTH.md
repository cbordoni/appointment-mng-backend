# Applying JWT Authentication to Routes

This guide shows how to protect routes with JWT authentication.

## Overview

All routes except `/auth/login` should be protected with JWT authentication. Users must include a valid JWT token in the `Authorization` header to access protected routes.

## Implementation Pattern

### Pattern 1: Wrap Routes with Auth Middleware (Recommended)

Create protected route groups and apply the `requireAuth` middleware:

```typescript
import { Elysia } from "elysia";
import { requireAuth } from "@/common/http/auth.middleware";

export const protectedRoutes = new Elysia({ prefix: "/api" });

// Create a protected branch
const protected = protectedRoutes
  .use(requireAuth)
  .get("/profile", ({ auth }) => ({
    data: { userId: auth.user.accountId, name: auth.user.name }
  }));

// Export to app.ts
export const storeRoutes = protectedRoutes
  .use(requireAuth)
  .get("/stores", async ({ auth }) => {
    // auth.user contains the JWT payload
    return await controller.getAll();
  })
  .post("/stores", async ({ auth, body }) => {
    return await controller.create(body);
  });
```

### Pattern 2: Individual Route Protection

Protect individual routes by applying middleware on specific routes:

```typescript
import { Elysia } from "elysia";
import { requireAuth } from "@/common/http/auth.middleware";

export const routes = new Elysia()
  // Public route
  .post("/auth/login", async ({ body }) => {
    return await controller.login(body);
  })
  
  // Protected routes
  .use(requireAuth)
  .get("/profile", ({ auth }) => {
    return { userId: auth.user.accountId };
  })
  .get("/settings", ({ auth }) => {
    return { email: auth.user.taxId };
  });
```

## Accessing User Information

Inside protected route handlers, you can access the authenticated user through the `auth` context:

```typescript
.get("/profile", async ({ auth }) => {
  const user = auth.user; // From JWT payload
  
  return {
    accountId: user.accountId,
    taxId: user.taxId,
    name: user.name,
    issuedAt: new Date(user.iat * 1000),
    expiresAt: new Date(user.exp * 1000)
  };
})
```

## App Registration

In `src/app.ts`, register protected routes after the auth routes:

```typescript
export const app = new Elysia()
  .use(cors())
  .use(requestLoggerPlugin)
  .use(httpErrorMapperPlugin)
  .use(errorLoggerPlugin)
  .use(prometheus())
  .use(openapi({...}))
  .get("/", () => ({ message: "API Root" }))
  
  // Public route - no auth required
  .use(authRoutes)
  
  // Protected routes - require valid JWT token
  .use(storeRoutes)        // All store endpoints protected
  .use(accountRoutes)      // All account endpoints protected
  .use(clientRoutes)       // All client endpoints protected
  .use(professionalRoutes) // All professional endpoints protected
  .use(appointmentRoutes)  // All appointment endpoints protected
  // ... other protected routes
  ;
```

## Example: Protected Store Routes

```typescript
// src/features/store/store.routes.ts
import { Elysia } from "elysia";
import { requireAuth } from "@/common/http/auth.middleware";

import { controller } from ".";
import { CreateStoreSchema, StoreIdSchema, UpdateStoreSchema } from "./store.types";

export const storeRoutes = new Elysia({ prefix: "/stores" })
  // Apply auth to all routes in this group
  .use(requireAuth)
  
  .get(
    "/",
    async ({ query, auth }) => {
      // auth.user is available here
      return await controller.getAll(query);
    },
    {
      query: PaginationQuerySchema,
      detail: {
        summary: "Get all stores (requires authentication)",
        tags: ["Stores"]
      }
    }
  )
  .get(
    "/:id",
    async ({ params, auth }) => {
      return await controller.getById(params.id);
    },
    {
      params: StoreIdSchema,
      detail: {
        summary: "Get store by ID (requires authentication)",
        tags: ["Stores"]
      }
    }
  )
  .post(
    "/",
    async ({ body, auth }) => {
      return await controller.create(body);
    },
    {
      body: CreateStoreSchema,
      detail: {
        summary: "Create a new store (requires authentication)",
        tags: ["Stores"]
      }
    }
  )
  // ... other routes
  ;
```

## Testing Protected Routes

### Using cURL

```bash
# 1. Get token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"taxId": "12345678901", "password": "password123"}' \
  | jq -r '.data.token')

# 2. Use token on protected route
curl -X GET http://localhost:3000/stores \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Using HTTP Client Files

Create request files in `http/` directory and set the token variable:

```http
@baseUrl = http://localhost:3000
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Get stores (requires auth)
GET {{baseUrl}}/stores
Authorization: Bearer {{token}}
```

## Error Handling

### 401 Unauthorized - Missing Token

Request:
```bash
GET /stores
```

Response:
```json
{
  "code": "UNAUTHORIZED",
  "message": "Missing or invalid authorization header",
  "status": 401
}
```

### 401 Unauthorized - Invalid Token

Response:
```json
{
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired token",
  "status": 401
}
```

## Best Practices

1. **Always use `requireAuth` for non-public routes**: Ensure all business logic routes are protected
2. **Access auth user data from context**: Use `auth.user` to get authenticated user information
3. **Set JWT_SECRET in production**: Change the default development secret in your environment
4. **Log authentication events**: The JWT service logs validation failures
5. **Don't store sensitive data in JWT**: Only include accountId, taxId, and name
6. **Validate token on each request**: The `requireAuth` middleware does this automatically

## Summary

To add authentication to your API:

1. Wrap route definitions with `.use(requireAuth)` middleware
2. Access user via `auth.user` parameter in handlers
3. JWT tokens expire after 7 days - users must login again
4. Invalid/expired tokens return 401 responses
5. All routes (except `/auth/login`) should be protected by default
