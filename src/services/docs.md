# Noridoc: services

Path: @/src/services

### Overview

- Contains API client interfaces and their concrete implementations for external services
- Has one service (`luma.ts`) that wraps the Luma public REST API (`https://public-api.luma.com`), covering events, guests, hosts, ticket types, calendar management (settings, admins, coupons, event tags, event submissions), contacts (list, import, contact tags), memberships (tiers, member management), and organization management (org admins, org calendars, org events, event transfer, calendar creation)

### How it fits into the larger codebase

- `@/src/index.ts` creates the concrete service via `createLumaService(apiKey)` and passes it into `createProgram`
- Command factories in `@/src/commands/` depend only on the `LumaService` interface -- they never import `createLumaService` directly
- Tests substitute the real service with `createMockLumaService()` from `@/tests/helpers.ts`, which implements the same `LumaService` interface using in-memory Maps

```
 LumaService interface (src/services/luma.ts)
       |                        |
 createLumaService()       createMockLumaService()
 (HTTP via fetch)          (in-memory Maps)
       |                        |
    index.ts                tests/helpers.ts
```

### Core Implementation

- **`luma.ts`** defines the `LumaService` interface and all related domain types (e.g., `LumaEvent`, `LumaOrgEvent`, `LumaCalendar`, `LumaGuest`) plus shared types like `PaginatedResponse` and `GuestIdentifier`
- `createLumaService(apiKey)` returns an object implementing `LumaService` using a private `request<T>()` helper that wraps `fetch`
- The `request` helper handles: URL construction with query params, JSON serialization/deserialization, the `x-luma-api-key` auth header, and HTTP error translation (non-OK responses throw `Error` with status code and response body)
- API method mapping:

| Service Method         | HTTP Method | Luma Endpoint                   |
|------------------------|-------------|---------------------------------|
| `listEvents`           | GET         | `/v1/calendar/list-events`      |
| `getEvent`             | GET         | `/v1/event/get`                 |
| `createEvent`          | POST        | `/v1/event/create`              |
| `updateEvent`          | POST        | `/v1/event/update`              |
| `requestCancellation`  | POST        | `/v1/event/cancel/request`      |
| `cancelEvent`          | POST        | `/v1/event/cancel`              |
| `listGuests`           | GET         | `/v1/event/get-guests`          |
| `getGuest`             | GET         | `/v1/events/guests/get`         |
| `addGuests`            | POST        | `/v1/event/add-guests`          |
| `updateGuestStatus`    | POST        | `/v1/event/update-guest-status` |
| `sendInvites`          | POST        | `/v1/event/send-invites`        |
| `createHost`           | POST        | `/v1/event/hosts/create`        |
| `updateHost`           | POST        | `/v1/event/hosts/update`        |
| `removeHost`           | POST        | `/v1/event/hosts/remove`        |
| `listTicketTypes`      | GET         | `/v1/events/ticket-types/list`  |
| `getTicketType`        | GET         | `/v1/events/ticket-types/get`   |
| `createTicketType`     | POST        | `/v1/events/ticket-types/create`|
| `updateTicketType`     | POST        | `/v1/events/ticket-types/update`|
| `deleteTicketType`     | POST        | `/v1/event/ticket-types/delete` |
| `getCalendar`          | GET         | `/v1/calendars/get`             |
| `lookupEvent`          | GET         | `/v1/calendar/lookup-event`     |
| `addEventToCalendar`   | POST        | `/v1/calendar/add-event`        |
| `approveEvent`         | POST        | `/v1/calendar/approve-event`    |
| `rejectEvent`          | POST        | `/v1/calendar/reject-event`     |
| `listAdmins`           | GET         | `/v1/calendar/admins/list`      |
| `listCoupons`          | GET         | `/v1/calendar/coupons`          |
| `createCoupon`         | POST        | `/v1/calendars/coupons/create`  |
| `updateCoupon`         | POST        | `/v1/calendar/coupons/update`   |
| `listEventTags`        | GET         | `/v1/calendar/event-tags/list`  |
| `createEventTag`       | POST        | `/v1/calendar/event-tags/create`|
| `updateEventTag`       | POST        | `/v1/calendar/event-tags/update`|
| `deleteEventTag`       | POST        | `/v1/calendar/event-tags/delete`|
| `applyEventTag`        | POST        | `/v1/calendar/event-tags/apply` |
| `unapplyEventTag`      | POST        | `/v1/calendar/event-tags/unapply`|
| `listContacts`         | GET         | `/v1/calendars/contacts/list`   |
| `importContacts`       | POST        | `/v1/calendars/contacts/import` |
| `listContactTags`      | GET         | `/v1/calendars/contact-tags/list`|
| `createContactTag`     | POST        | `/v1/calendars/contact-tags/create`|
| `applyContactTag`      | POST        | `/v1/calendars/contact-tags/apply`|
| `unapplyContactTag`    | POST        | `/v1/calendars/contact-tags/unapply`|
| `updateContactTag`     | POST        | `/v1/calendars/contact-tags/update`|
| `deleteContactTag`     | POST        | `/v1/calendars/contact-tags/delete`|
| `listMembershipTiers`  | GET         | `/v1/memberships/tiers/list`       |
| `addMember`            | POST        | `/v1/memberships/members/add`      |
| `updateMemberStatus`   | POST        | `/v1/memberships/members/update-status`|
| `listOrgAdmins`        | GET         | `/v1/organizations/admins/list`    |
| `listOrgCalendars`     | GET         | `/v1/organizations/calendars/list` |
| `listOrgEvents`        | GET         | `/v1/organizations/events/list`    |
| `transferEventCalendar`| POST        | `/v1/organizations/events/transfer-calendar`|
| `createCalendar`       | POST        | `/v2/organizations/calendars/create`|

### Things to Know

- The `request` helper returns `undefined as T` when the response body is empty -- this is used by void-returning methods (e.g., `cancelEvent`, `addGuests`, `transferEventCalendar`); the cast is intentional
- GET endpoints (`listEvents`, `listGuests`, `getEvent`, `getGuest`) map camelCase params to the API's snake_case query params; POST endpoints pass params directly as JSON body
- GET requests pass parameters as query strings; POST requests pass parameters as JSON body. Note that `getEvent` uses `GET` with `?id=` rather than a path parameter
- The `GuestIdentifier` type is a discriminated union (`type: "email" | "api_id"`) used by `updateGuestStatus` to identify a guest by either email or API ID
- Cancellation is a two-step protocol enforced by the Luma API: first `requestCancellation` returns a `cancellation_token`, then `cancelEvent` must be called with both the event ID and that token
- The ticket type endpoints split across `/v1/events/` (list, get, create, update) and `/v1/event/` (delete) -- this is a known Luma API inconsistency, not a typo
- Calendar endpoints similarly split: `getCalendar` uses `/v1/calendars/get` (plural) while most others use `/v1/calendar/` (singular). `createCoupon` uses `/v1/calendars/coupons/create` (plural) but `updateCoupon` uses `/v1/calendar/coupons/update` (singular) -- again a Luma API inconsistency
- Some list endpoints return `{ entries: T[] }` without pagination (e.g., `listTicketTypes`, `listAdmins`, `listEventTags`, `listContactTags`, `listOrgAdmins`), while others return `PaginatedResponse<T>` with cursor-based pagination (e.g., `listEvents`, `listGuests`, `listOrgCalendars`, `listOrgEvents`)
- `addEventToCalendar` accepts a discriminated union param type (`AddEventLumaParams | AddEventExternalParams`) keyed on `platform: "luma" | "external"` -- the two shapes have completely different fields
- `CreateCouponParams.discount` is a discriminated union keyed on `discount_type: "percent" | "amount"` -- percent discounts carry `percent_off`, amount discounts carry `cents_off` and `currency`
- `applyEventTag` and `unapplyEventTag` identify tags by ID or name (both accepted in a single `tag` string param) and return counts of applied/removed vs skipped events
- The `listContacts` method does not use the shared `request` helper -- it manually constructs the fetch call because it needs `url.searchParams.append` (not `set`) for the `tags` array parameter, which requires repeated query params (e.g., `?tags=vip&tags=sponsor`) rather than a single value. Contact tag endpoints use `/v1/calendars/` (plural) consistently, unlike the split seen in event-related endpoints
- `applyContactTag` and `unapplyContactTag` identify contacts by `emails` and/or `user_ids` arrays, and identify tags by ID or name (both accepted in a single `tag` string param) -- mirroring the event tag apply/unapply pattern but targeting contacts instead of events. `createContactTag` returns `{ id: string }` while `createEventTag` returns `{ tag_id: string; tag_api_id: string }` -- different response shapes from the Luma API
- Membership endpoints use a distinct `/v1/memberships/` prefix (not `/v1/calendar/` or `/v1/calendars/`), which is unique among the API groups. `LumaMembershipTierAccessInfo.type` indicates the tier's access model (e.g., `"free"`, `"payment-once"`), and paid tiers include Stripe-related fields. `addMember` returns an `AddMemberResponse` with `membership_id` and `status`, while `updateMemberStatus` returns void
- Organization endpoints use a distinct `/v1/organizations/` prefix (not `/v1/calendar/` or `/v1/calendars/`), except `createCalendar` which is the only v2 endpoint in the codebase (`/v2/organizations/calendars/create`). `listOrgAdmins` returns `{ entries: LumaCalendarAdmin[] }` without pagination (same shape as calendar admins). `listOrgCalendars` and `listOrgEvents` return `PaginatedResponse<T>` with cursor-based pagination. `LumaOrgEvent` is a distinct type from `LumaEvent` -- it includes fields like `calendar_id`, `description_md`, `registration_questions`, `visibility`, and `feedback_email` that are absent from the standard event type. `transferEventCalendar` returns void (the API returns empty `{}`). Organization endpoints reuse `LumaCalendar` and `LumaCalendarAdmin` types where the response shapes match
- The service uses Node's built-in `fetch` (available since Node 18, which is the minimum engine requirement in `package.json`)

Created and maintained by Nori.
