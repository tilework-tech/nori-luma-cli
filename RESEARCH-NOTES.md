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
- POST /v1/event/ticket-types/delete — Delete ticket type (NOTE: singular /v1/event/)

### Coupons (2 additional endpoints)
- POST /v1/calendars/coupons/create — Create calendar coupon
- POST /v1/events/coupons/create — Create event coupon

### Contacts (8 endpoints, GET /v1/calendars/get already in Calendar)
- GET /v1/calendars/contacts/list — List contacts
- POST /v1/calendars/contacts/import — Import contacts
- GET /v1/calendars/contact-tags/list — List contact tags
- POST /v1/calendars/contact-tags/create — Create contact tag
- POST /v1/calendars/contact-tags/apply — Apply contact tag
- POST /v1/calendars/contact-tags/unapply — Remove contact tag
- POST /v1/calendars/contact-tags/update — Update contact tag
- POST /v1/calendars/contact-tags/delete — Delete contact tag

## Contact Endpoints Detail

### GET /v1/calendars/contacts/list (List Contacts)
- Query params (all optional): `query` (search names/emails), `tags` (string[] — repeated query params for tag IDs or names), `calendar_membership_tier_id`, `membership_status` (enum: approved/pending/approved-pending-payment/declined), `pagination_cursor`, `pagination_limit`, `sort_column` (enum: created_at/event_checked_in_count/event_approved_count/name/revenue_usd_cents), `sort_direction` (enum: asc/desc/asc nulls last/desc nulls last)
- Returns: paginated `{ entries: Contact[], has_more, next_cursor }`
- Contact shape: `{ id, user_id, created_at, event_approved_count, event_checked_in_count, revenue_usd_cents, tags: [{id, name}], membership: {status, calendar_membership_tier_id} | null, name, avatar_url, email, first_name, last_name }`

### POST /v1/calendars/contacts/import (Import Contacts)
- Body: `contacts` (required, array of `{email (required), name? (optional)}`), `tags` (optional, string[] — tag IDs or names to apply)
- Returns: empty `{}`
- Gotcha: Will NOT overwrite existing user names

### GET /v1/calendars/contact-tags/list (List Contact Tags)
- No query params, no pagination params
- Returns: `{ entries: [{id, name, color}], has_more }`
- Note: has_more present but no pagination mechanism

### POST /v1/calendars/contact-tags/create (Create Contact Tag)
- Body: `name` (required), `color` (optional, enum: cranberry/barney/red/green/blue/purple/yellow/orange)
- Returns: `{ id }` — note: just `id`, not `tag_id`/`tag_api_id` like event tags

### POST /v1/calendars/contact-tags/apply (Apply Contact Tag)
- Body: `tag` (required — tag ID or name), `user_ids` (optional, string[]), `emails` (optional, string[])
- Returns: `{ applied_count, skipped_count }`
- Note: Only works on existing contacts, does not create new ones

### POST /v1/calendars/contact-tags/unapply (Remove Contact Tag)
- Body: `tag` (required — tag ID or name), `user_ids` (optional, string[]), `emails` (optional, string[])
- Returns: `{ removed_count, skipped_count }`

### POST /v1/calendars/contact-tags/update (Update Contact Tag)
- Body: `tag_id` (required), `name` (optional), `color` (optional, same enum)
- Returns: empty `{}`
- Note: Uses `tag_id` not `tag`

### POST /v1/calendars/contact-tags/delete (Delete Contact Tag)
- Body: `tag_id` (required)
- Returns: empty `{}`

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

## Ticket Type Endpoints Detail

### GET /v1/events/ticket-types/list (List Ticket Types)
- Query params: `event_id` (required), `include_hidden` (string, optional)
- Returns: `{ entries: TicketType[] }` — no pagination (events have few ticket types)
- Note: `include_hidden` is typed as string, not boolean

### GET /v1/events/ticket-types/get (Get Ticket Type)
- Query params: `event_ticket_type_id` (required, format: ett-xxx)
- Returns: flat TicketType object (NOT wrapped in entries)

### POST /v1/events/ticket-types/create (Create Ticket Type)
- Body: `event_id` (required), `name` (required), `type` (required, enum: free/paid), plus optional: `require_approval`, `is_hidden`, `description`, `valid_start_at`, `valid_end_at`, `max_capacity`, `cents`, `currency`, `is_flexible`, `min_cents`
- Returns: created TicketType object

### POST /v1/events/ticket-types/update (Update Ticket Type)
- Body: `event_ticket_type_id` (required), all other fields optional (partial update)
- Returns: updated TicketType object

### POST /v1/event/ticket-types/delete (Delete Ticket Type)
- Note: singular `/v1/event/` path unlike other ticket-type endpoints
- Body: `event_ticket_type_id` (required in practice), `event_ticket_type_api_id` (deprecated)
- Returns: empty `{}`
- Constraints: cannot delete if tickets sold or last visible ticket type

### TicketType Object Shape
```json
{
  "id": "ett-xxx",
  "name": "string",
  "type": "free|paid",
  "require_approval": "boolean",
  "is_hidden": "boolean",
  "description": "string|null",
  "valid_start_at": "ISO date string|null",
  "valid_end_at": "ISO date string|null",
  "max_capacity": "number|null",
  "cents": "number|null",
  "currency": "string|null",
  "is_flexible": "boolean",
  "min_cents": "number|null"
}
```
Required response fields: `id`, `name`, `type`

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

## Calendar Endpoints Detail

### GET /v1/calendars/get (Get Calendar)
- No query params — calendar determined by API key
- Returns: flat Calendar object (NOT wrapped in entries)
- Fields: `id`, `name`, `slug` (nullable), `avatar_url` (nullable), `url`, `description` (nullable), `social_image_url` (nullable), `cover_image_url` (nullable), `is_personal` (boolean), `location` (object|null with city/region/country/country_code/timezone), `coordinate` (object|null with longitude/latitude), `instagram_handle` (nullable), `twitter_handle` (nullable), `youtube_handle` (nullable), `website` (nullable)
- Note: path uses plural `/v1/calendars/` unlike most other calendar endpoints

### GET /v1/calendar/lookup-event (Lookup Event on Calendar)
- Query params: `platform` (enum: external/luma, optional), `url` (optional), `event_id` (optional), `event_api_id` (deprecated)
- Returns: `{ event: { id, api_id, status } | null }` — event can be null if not found
- Status enum: approved/pending/rejected

### POST /v1/calendar/add-event (Add Event to Calendar)
- Two variants via oneOf:
  - External: `platform:"external"`, `url` (required), `name` (required), `start_at` (required), `duration_interval` (required), `timezone` (required), optional `submission_mode` (auto/pending), `geo_address_json`, `host`, `coordinate`
  - Luma: `platform:"luma"`, `event_id` (optional but logically required), optional `submission_mode`
- Returns: `{ id, api_id, status }` — status is approved/pending
- Calendar managers get auto-approved by default; use `submission_mode:"pending"` to keep pending

### POST /v1/calendar/approve-event
- Body: `calendar_event_id` (required, accepts calev- or evt- prefix)
- Returns: empty `{}`

### POST /v1/calendar/reject-event
- Body: `calendar_event_id` (required, accepts calev- or evt- prefix), `message` (optional)
- Returns: empty `{}`

### GET /v1/calendar/admins/list (List Calendar Admins)
- No query params
- Returns: `{ entries: [{ id, name (nullable), avatar_url, email, first_name (nullable), last_name (nullable), api_id }] }`
- No pagination — returns all admins

### GET /v1/calendar/coupons (List Calendar Coupons)
- Query params: `pagination_cursor` (optional), `pagination_limit` (optional)
- Returns: paginated `{ entries: [Coupon], has_more, next_cursor }`
- Coupon shape: `{ id, api_id, code, remaining_count, valid_start_at, valid_end_at, percent_off (nullable), cents_off (nullable), currency (nullable), event_ticket_type_id (optional) }`

### POST /v1/calendars/coupons/create (Create Calendar Coupon)
- Note: path uses plural `/v1/calendars/` (inconsistency)
- Body: `code` (required, 1-20 chars), `discount` (required, oneOf: `{discount_type:"percent", percent_off}` or `{discount_type:"amount", cents_off, currency}`), `remaining_count` (optional, 0-1000000), `valid_start_at` (optional), `valid_end_at` (optional)
- Returns: created Coupon object

### POST /v1/calendar/coupons/update (Update Calendar Coupon)
- Body: `code` (required — identifies coupon), `remaining_count` (optional), `valid_start_at` (optional), `valid_end_at` (optional)
- Returns: empty `{}`
- Cannot change discount amount/type or the code itself

### GET /v1/calendar/event-tags/list (List Event Tags)
- No query params, no pagination
- Returns: `{ entries: [{ id, api_id, name, color }] }`

### POST /v1/calendar/event-tags/create (Create Event Tag)
- Body: `name` (required), `color` (optional, enum: cranberry/barney/red/green/blue/purple/yellow/orange or null)
- Returns: `{ tag_id, tag_api_id }` — note: uses tag_id not id

### POST /v1/calendar/event-tags/update (Update Event Tag)
- Body: `tag_id` (logically required), `name` (optional), `color` (optional, same enum but no null)
- Returns: empty `{}`

### POST /v1/calendar/event-tags/delete (Delete Event Tag)
- Body: `tag_id` (logically required)
- Returns: empty `{}`

### POST /v1/calendar/event-tags/apply (Apply Event Tag)
- Body: `tag` (required — accepts tag ID or tag name), `event_ids` (optional, string[])
- Returns: `{ applied_count, skipped_count }`

### POST /v1/calendar/event-tags/unapply (Remove Event Tag)
- Body: `tag` (required — accepts tag ID or tag name), `event_ids` (optional, string[])
- Returns: `{ removed_count, skipped_count }`

## Contact Endpoints Detail

### GET /v1/calendars/contacts/list (List Contacts)
- Query params (all optional): `query` (string, search over names/emails), `tags` (string[], repeated query params, OR logic), `calendar_membership_tier_id` (string), `membership_status` (enum: approved/pending/approved-pending-payment/declined), `pagination_cursor`, `pagination_limit`, `sort_column` (enum: created_at/event_checked_in_count/event_approved_count/name/revenue_usd_cents), `sort_direction` (enum: asc/desc/asc nulls last/desc nulls last)
- Returns: paginated `{ entries: [Contact], has_more, next_cursor }`
- Contact shape: `{ id, user_id, created_at, event_approved_count, event_checked_in_count, revenue_usd_cents, tags: [{id, name}], membership: {status, calendar_membership_tier_id} | null, name (nullable), avatar_url, email, first_name (nullable), last_name (nullable) }`
- Note: `next_cursor` only present when `has_more` is true
- Note: `tags` filter uses OR logic (contacts with ANY of the specified tags)
- Note: `sort_direction` supports null-positioning variants with spaces

### POST /v1/calendars/contacts/import (Import Contacts)
- Body: `contacts` (required, array of `{email (required), name (optional)}`), `tags` (optional, string[], tag IDs or tag names)
- Returns: empty `{}`
- Note: will NOT overwrite existing user's name
- Note: `tags` can be tag IDs or tag names mixed freely

### GET /v1/calendars/contact-tags/list (List Contact Tags)
- No query params
- Returns: `{ entries: [{id, name, color}], has_more }`
- No pagination mechanism (no next_cursor in response, no pagination params)
- `has_more` likely always false (returns all tags)

### POST /v1/calendars/contact-tags/create (Create Contact Tag)
- Body: `name` (required), `color` (optional, nullable, enum: cranberry/barney/red/green/blue/purple/yellow/orange)
- Returns: `{ id }` — just the tag ID (starts with tag-)
- Note: unlike event-tags/create which returns `{tag_id, tag_api_id}`

### POST /v1/calendars/contact-tags/apply (Apply Contact Tag)
- Body: `tag` (required, accepts tag ID or tag name), `user_ids` (optional, string[]), `emails` (optional, string[])
- Returns: `{ applied_count, skipped_count }`
- Note: does NOT create new contacts; non-contacts counted in skipped_count
- Note: logically need at least one of user_ids or emails

### POST /v1/calendars/contact-tags/unapply (Remove Contact Tag)
- Body: `tag` (required, accepts tag ID or tag name), `user_ids` (optional, string[]), `emails` (optional, string[])
- Returns: `{ removed_count, skipped_count }`
- Note: only affects existing contacts

### POST /v1/calendars/contact-tags/update (Update Contact Tag)
- Body: `tag_id` (required, starts with tag-), `name` (optional), `color` (optional, enum: cranberry/barney/red/green/blue/purple/yellow/orange — NOT nullable unlike create)
- Returns: empty `{}`
- Note: uses `tag_id` not `tag` — requires actual ID, not name

### POST /v1/calendars/contact-tags/delete (Delete Contact Tag)
- Body: `tag_id` (required, starts with tag-)
- Returns: empty `{}`
- Note: uses `tag_id` not `tag` — requires actual ID, not name

### Contact Endpoint Gotchas
- All paths use plural `/v1/calendars/` (consistent within contacts, unlike calendar/event-tags)
- apply/unapply use `tag` (accepts ID or name), update/delete use `tag_id` (ID only) — same inconsistency as event-tags
- Contact tag create returns `{ id }` whereas event tag create returns `{ tag_id, tag_api_id }`
- Contact apply/unapply accept `user_ids`/`emails` arrays; event tag apply/unapply accept `event_ids`
- Import returns empty `{}` with no feedback on counts
- Color enum (8 values): cranberry, barney, red, green, blue, purple, yellow, orange

## Reference Projects in Codebase
- `nori-newsletter-cli`: commander + TypeScript + vitest, factory functions for DI, Output abstraction, services/ layer
- `nori-slack-cli`: Same patterns, includes paginate.ts and suggest.ts utilities

## Technology Stack Decision
- commander (CLI framework) — matches reference projects
- TypeScript + ESM — matches reference projects
- vitest — matches reference projects
- Node built-in fetch — no SDK exists, native fetch sufficient for REST JSON API
- tsx — dev runner, matches reference projects
