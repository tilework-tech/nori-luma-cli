# Noridoc: services

Path: @/src/services

### Overview

- Contains API client interfaces and their concrete implementations for external services
- Currently has one service (`luma.ts`) that wraps the Luma public REST API (`https://public-api.luma.com`)

### How it fits into the larger codebase

- `@/src/index.ts` creates the concrete service via `createLumaService(apiKey)` and passes it into `createProgram`
- Command factories in `@/src/commands/` depend only on the `LumaService` interface -- they never import `createLumaService` directly
- Tests substitute the real service with `createMockLumaService()` from `@/tests/helpers.ts`, which implements the same `LumaService` interface using an in-memory `Map<string, LumaEvent>`

```
 LumaService interface (src/services/luma.ts)
       |                        |
 createLumaService()       createMockLumaService()
 (HTTP via fetch)          (in-memory Map)
       |                        |
    index.ts                tests/helpers.ts
```

### Core Implementation

- **`luma.ts`** defines the `LumaService` interface and all related types (`LumaEvent`, `PaginatedResponse`, `CreateEventParams`, `UpdateEventParams`, `CancelRequestResponse`, `ListEventsParams`)
- `createLumaService(apiKey)` returns an object implementing `LumaService` using a private `request<T>()` helper that wraps `fetch`
- The `request` helper handles: URL construction with query params, JSON serialization/deserialization, the `x-luma-api-key` auth header, and HTTP error translation (non-OK responses throw `Error` with status code and response body)
- API method mapping:

| Service Method         | HTTP Method | Luma Endpoint                |
|------------------------|-------------|------------------------------|
| `listEvents`           | GET         | `/v1/calendar/list-events`   |
| `getEvent`             | GET         | `/v1/event/get`              |
| `createEvent`          | POST        | `/v1/event/create`           |
| `updateEvent`          | POST        | `/v1/event/update`           |
| `requestCancellation`  | POST        | `/v1/event/cancel/request`   |
| `cancelEvent`          | POST        | `/v1/event/cancel`           |

### Things to Know

- The `request` helper returns `undefined as T` when the response body is empty -- this is used by `cancelEvent` which returns `void`; the cast is intentional
- `listEvents` maps camelCase params (`paginationLimit`, `paginationCursor`) to the API's snake_case query params (`pagination_limit`, `pagination_cursor`); other methods pass params directly as JSON body
- GET requests pass parameters as query strings; POST requests pass parameters as JSON body. Note that `getEvent` uses `GET` with `?id=` rather than a path parameter
- Cancellation is a two-step protocol enforced by the Luma API: first `requestCancellation` returns a `cancellation_token`, then `cancelEvent` must be called with both the event ID and that token
- The service uses Node's built-in `fetch` (available since Node 18, which is the minimum engine requirement in `package.json`)

Created and maintained by Nori.
