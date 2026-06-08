# Research Notes

## Luma API Overview

- **Base URL**: `https://public-api.luma.com`
- **Auth**: `x-luma-api-key` header with API key (calendar-scoped or org-scoped)
- **Rate limits**: 200 req/min (calendar keys), 500 req/min (org keys), shared across all endpoints
- **Pagination**: Cursor-based with `pagination_cursor` and `pagination_limit` params; responses include `has_more` and `next_cursor`
- **Mutations**: All writes use POST (no PUT/PATCH/DELETE HTTP methods)
- **OpenAPI spec**: Available at `https://public-api.luma.com/openapi.json` (1.8MB, 61 endpoints)
- **No existing TypeScript SDK** — must build from scratch

## API Endpoints (55+ across 10 categories)

### Calendar (14 endpoints)
- GET /v1/calendar/list-events — List events managed by calendar
- GET /v1/calendar/lookup-event — Check if event exists on calendar
- POST /v1/calendar/add-event — Add event to calendar
- POST /v1/calendar/approve-event — Approve pending event
- POST /v1/calendar/reject-event — Reject pending event
- GET /v1/calendar/admins/list — List calendar admins
- GET /v1/calendar/coupons — List calendar coupons
- POST /v1/calendar/coupons/update — Update calendar coupon
- GET /v1/calendar/event-tags/list — List event tags
- POST /v1/calendar/event-tags/create — Create event tag
- POST /v1/calendar/event-tags/update — Update event tag
- POST /v1/calendar/event-tags/delete — Delete event tag
- POST /v1/calendar/event-tags/apply — Apply event tag to events
- POST /v1/calendar/event-tags/unapply — Remove event tag from events

### Event (7 endpoints)
- GET /v1/event/get — Get event admin info
- POST /v1/event/create — Create new event
- POST /v1/event/update — Update event
- POST /v1/event/cancel/request — Request cancellation token (15-min validity)
- POST /v1/event/cancel — Cancel event (irreversible, requires token)
- GET /v1/event/coupons — List event coupons
- POST /v1/event/update-coupon — Update event coupon

### Event Hosts (3 endpoints)
- POST /v1/event/hosts/create — Add host
- POST /v1/event/hosts/update — Update host
- POST /v1/event/hosts/remove — Remove host

### Guests (5 endpoints)
- GET /v1/event/get-guests — List guests
- GET /v1/events/guests/get — Get guest details
- POST /v1/event/add-guests — Add guests
- POST /v1/event/update-guest-status — Update guest status
- POST /v1/event/send-invites — Send invites

### Ticket Types (5 endpoints)
- GET /v1/events/ticket-types/list — List ticket types
- GET /v1/events/ticket-types/get — Get ticket type
- POST /v1/events/ticket-types/create — Create ticket type
- POST /v1/events/ticket-types/update — Update ticket type
- POST /v1/event/ticket-types/delete — Delete ticket type

### Coupons (2 additional endpoints)
- POST /v1/calendars/coupons/create — Create calendar coupon
- POST /v1/events/coupons/create — Create event coupon

### Contacts (9 endpoints)
- GET /v1/calendars/contacts/list — List contacts
- POST /v1/calendars/contacts/import — Import contacts
- GET /v1/calendars/contact-tags/list — List contact tags
- POST /v1/calendars/contact-tags/create — Create contact tag
- POST /v1/calendars/contact-tags/apply — Apply contact tag
- POST /v1/calendars/contact-tags/unapply — Remove contact tag
- POST /v1/calendars/contact-tags/update — Update contact tag
- POST /v1/calendars/contact-tags/delete — Delete contact tag
- GET /v1/calendars/get — Get calendar details

### Memberships (3 endpoints)
- GET /v1/memberships/tiers/list — List tiers
- POST /v1/memberships/members/add — Add member
- POST /v1/memberships/members/update-status — Update member status

### Organizations (5 endpoints)
- GET /v1/organizations/admins/list — List org admins
- GET /v1/organizations/calendars/list — List org calendars
- GET /v1/organizations/events/list — List org events
- POST /v1/organizations/events/transfer-calendar — Transfer event
- POST /v2/organizations/calendars/create — Create calendar (v2)

### Webhooks (5 endpoints)
- GET /v1/webhooks/list — List webhooks
- GET /v2/webhooks/get — Get webhook
- POST /v2/webhooks/create — Create webhook
- POST /v2/webhooks/update — Update webhook
- POST /v1/webhooks/delete — Delete webhook

### Utility (3 endpoints)
- GET /v1/entity/lookup — Lookup entity by slug
- GET /v1/users/get-self — Get authenticated user
- POST /v1/images/create-upload-url — Get image upload URL

## Guest Endpoints Detail

### GET /v1/event/get-guests (List Guests)
- Query params: `event_id`, `approval_status` (enum: approved/session/pending_approval/invited/declined/waitlist), `pagination_cursor`, `pagination_limit`, `sort_column` (name/email/created_at/registered_at/checked_in_at), `sort_direction` (asc/desc)
- Returns: PaginatedResponse with entries containing: `id`, `user_id`, `user_email`, `user_name`, `approval_status`, `check_in_qr_code`, `registered_at`, `invited_at`, `event_tickets[]`, etc.
- Note: Does NOT include `event_ticket_orders` (use single-guest endpoint for that)

### GET /v1/events/guests/get (Get Single Guest)
- Note path: `/v1/events/` (plural) vs list which is `/v1/event/` (singular)
- Query params: `event_id` (required), `id` (required — can be guest ID `gst-`, ticket key, guest key `g-`, or email)
- Returns: Single guest object (NOT wrapped in entries), includes `event_ticket_orders[]` with `coupon_info`

### POST /v1/event/add-guests
- Body: `event_id`, `guests[]` (each with required `email`, optional `name`), `approval_status` (enum: approved/pending_approval/waitlist only), `send_email` (default true), `ticket`/`tickets` (mutually exclusive)
- Returns: empty `{}`
- Note: Cannot set status to `declined` or `invited` via this endpoint

### POST /v1/event/update-guest-status
- Body: `event_id`, `guest` (discriminated union: `{type:"email", email}` or `{type:"api_id", api_id}`), `status` (enum: approved/declined/pending_approval/waitlist), `should_refund` (default false), `send_email` (default true)
- Returns: empty `{}`

### POST /v1/event/send-invites
- Body: `event_id`, `guests[]` (each with required `email`, optional `name`), `message` (max 200 chars)
- Returns: empty `{}`
- Sets guest status to `invited`

## Host Endpoints Detail

### POST /v1/event/hosts/create
- Body: `event_id` (required), `email` (required), `access_level` (enum: none/check-in/manager, default manager), `is_visible` (boolean, default true), `name` (optional, ignored if existing Luma profile)
- Returns: empty `{}`
- Limits: 5 hosts standard, 70 hosts verified calendars

### POST /v1/event/hosts/update
- Body: `event_id` (required), `email` (required), `access_level` (optional), `is_visible` (optional)
- Returns: empty `{}`
- Creator's access level cannot be changed

### POST /v1/event/hosts/remove
- Body: `event_id` (required), `email` (required)
- Returns: empty `{}`
- Creator cannot be removed

### Host Object Shape (from event GET response)
```json
{ "id": "string", "email": "string", "name": "string|null", "first_name": "string|null", "last_name": "string|null", "avatar_url": "string" }
```
- access_level and is_visible are write-only (not returned in GET responses)
- Host endpoints are NOT in the OpenAPI spec (documented only on reference docs site)

## Key Gotchas
- Two-step cancellation flow (request token → cancel)
- Inconsistent singular/plural paths (/v1/event/ vs /v1/events/)
- Mixed API versions (most v1, some v2)
- Deprecated `*_api_id` params in favor of `*_id`
- Image upload requires two steps (get URL then upload)
- Guest summary vs detail endpoints differ in response shape (list lacks event_ticket_orders)
- Creator cannot be removed from hosts
- Guest update-guest-status uses discriminated union for guest identifier
- Host endpoints return empty {} — CLI should output confirmation JSON
- add-guests approval_status restricted to approved/pending_approval/waitlist (no declined/invited)
- send-invites message has 200 char max

## Reference Projects in Codebase
- `nori-newsletter-cli`: commander + TypeScript + vitest, factory functions for DI, Output abstraction, services/ layer
- `nori-slack-cli`: Same patterns, includes paginate.ts and suggest.ts utilities

## Technology Stack Decision
- commander (CLI framework) — matches reference projects
- TypeScript + ESM — matches reference projects
- vitest — matches reference projects
- Node built-in fetch — no SDK exists, native fetch sufficient for REST JSON API
- tsx — dev runner, matches reference projects
