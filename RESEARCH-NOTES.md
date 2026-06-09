# Research Notes

## Luma API Overview

- **Base URL**: `https://public-api.luma.com`
- **Auth**: `x-luma-api-key` header with API key (calendar-scoped or org-scoped)
- **Rate limits**: 500 GET/5min, 100 POST/5min per calendar (tracked separately); 429 response with 1-min lockout on exceed. Enterprise customers can negotiate higher limits.
- **Pagination**: Cursor-based with `pagination_cursor` and `pagination_limit` params; responses include `has_more` and `next_cursor`
- **Mutations**: All writes use POST (no PUT/PATCH/DELETE HTTP methods)
- **OpenAPI spec**: Available at `https://public-api.luma.com/openapi.json` — GET endpoints only (~17 paths). All 44 POST endpoints are documented only on the reference site, not in the spec.
- **No existing TypeScript SDK** — must build from scratch

## Missing CLI Parameters (Audit June 2026)

Comparison of OpenAPI spec parameters against CLI command options revealed ~28 missing parameters:

### events list (GET /v1/calendar/list-events) — 4 missing
- `platforms` (array of luma/external — filter by platform)
- `sort_column` (enum: start_at)
- `sort_direction` (enum: asc/desc/asc nulls last/desc nulls last)
- `status` (enum: approved/pending — filter by approval status)

### events create (POST /v1/event/create) — 10 missing
- `can_register_for_multiple_tickets` (boolean)
- `coordinate` (object: {longitude, latitude})
- `geo_address_json` (oneOf: manual {type, address} or google {type, place_id, description}) — exists in service interface but not wired to CLI
- `name_requirement` (enum: full-name/first-last)
- `phone_number_requirement` (enum: optional/required or null)
- `registration_questions` (complex polymorphic array — 15 question types)
- `reminders_disabled` (boolean)
- `feedback_email` (object: {enabled, delay})
- `show_guest_list` (boolean)
- `tint_color` (string, hex color e.g. '#E3CBEF')

### events update (POST /v1/event/update) — same 10 missing as create

### calendar add-event (POST /v1/calendar/add-event, external variant) — 4 missing
- `geo_address_json` (structured location)
- `geo_longitude` (number)
- `geo_latitude` (number)
- `coordinate` (object: {longitude, latitude})

### guests list (GET /v1/event/get-guests) — help text gaps
- `--sort-direction` help says "asc, desc" but API also accepts "asc nulls last", "desc nulls last"
- `--status` help omits "session" value that the API accepts

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
- GET /v1/memberships/tiers/list — List membership tiers
- POST /v1/memberships/members/add — Add member to tier
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

## Membership Endpoints Detail

### GET /v1/memberships/tiers/list (List Membership Tiers)
- Query params: `pagination_cursor` (optional), `pagination_limit` (optional)
- Returns: paginated `{ entries: [MembershipTier], has_more, next_cursor }`
- MembershipTier shape: `{ id, name, description (nullable), tint_color (hex string), access_info (discriminated union) }`
- `access_info` variants (discriminated by `type`):
  - `type: "free"` — `{ type, require_approval }`
  - `type: "payment-once"` — `{ type, amount (>0), currency, require_approval }`
  - `type: "payment-recurring"` — `{ type, currency, stripe_account_id, stripe_product_id, stripe_monthly_price_id (nullable), amount_monthly (nullable), stripe_yearly_price_id (nullable), amount_yearly (nullable), require_approval }`

### POST /v1/memberships/members/add (Add Member to Tier)
- Body: `email` (required), `membership_tier_id` (required), `skip_payment` (boolean, required for paid tiers), `registration_answers` (optional array)
- Returns: `{ membership_id, status }` where status enum: approved/pending/approved-pending-payment/declined
- Note: `skip_payment: true` required when handling payment externally for paid tiers
- Note: Each person can belong to only one tier per calendar

### POST /v1/memberships/members/update-status (Update Member Status)
- Body: `user_id` (required — accepts usr-xxx ID or email address), `status` (required — enum: approved/declined)
- Returns: empty `{}`
- Note: Approving a paid tier member captures their payment. Declining cancels any active subscription.
- Note: Only `approved` and `declined` are valid status values (no `pending`)

### Membership Endpoint Gotchas
- Only 3 endpoints — no list-members, get-member, remove-member, create/update/delete-tier
- No member enumeration possible via API
- `user_id` field in update-status accepts either a Luma user ID or an email address
- `registration_answers` has complex discriminated union schema per question_type but is rarely needed for basic member add

## Organization Endpoints Detail

### GET /v1/organizations/admins/list (List Organization Admins)
- No query params — organization determined by API key (org-scoped key required)
- Returns: `{ entries: [{ id, name (nullable), avatar_url, email, first_name (nullable), last_name (nullable), api_id (deprecated) }] }`
- No pagination — returns all admins in a single response
- Admin object shape matches calendar admins from `/v1/calendar/admins/list`
- `api_id` is deprecated in favor of `id`

### GET /v1/organizations/calendars/list (List Organization Calendars)
- Query params: `pagination_cursor` (optional), `pagination_limit` (optional)
- Returns: paginated `{ entries: [Calendar], has_more, next_cursor }`
- Calendar object shape identical to `GET /v1/calendars/get` response (id, name, slug, avatar_url, url, description, social_image_url, cover_image_url, is_personal, location, coordinate, instagram_handle, twitter_handle, youtube_handle, website)
- `next_cursor` only present when `has_more` is true

### GET /v1/organizations/events/list (List Organization Events)
- Query params: `before` (ISO 8601 datetime, optional), `after` (ISO 8601 datetime, optional), `pagination_cursor` (optional), `pagination_limit` (optional), `sort_direction` (enum: asc/desc/asc nulls last/desc nulls last, optional)
- Returns: paginated `{ entries: [OrgEvent], has_more, next_cursor }`
- OrgEvent shape (richer than regular event): `{ platform: "luma", id, user_id, calendar_id, start_at, duration_interval, end_at, created_at, timezone, name, description, description_md, geo_address_json (nullable object), coordinate (nullable), meeting_url (nullable), cover_url, registration_questions (complex array), url, visibility (enum: public/members-only/private), feedback_email: {enabled, delay?} }`
- Also includes deprecated fields: `api_id`, `user_api_id`, `calendar_api_id`, `zoom_meeting_url`, `geo_latitude`, `geo_longitude`
- No `sort_column` param — sorting is presumably by event time
- No `calendar_id` filter — returns all events across all org calendars

### POST /v1/organizations/events/transfer-calendar (Transfer Event)
- Body: `event_id` (required, evt-xxx), `calendar_id` (required, cal-xxx — destination calendar, must belong to org)
- Returns: empty `{}`
- Both source and destination calendars must belong to the same organization
- No confirmation data returned

### POST /v2/organizations/calendars/create (Create Calendar)
- Note: v2 endpoint (only v2 in organizations group)
- Body: `name` (required), `slug` (optional), `description` (optional), `avatar_url` (optional, URI — must be Luma CDN URL), `tint_color` (optional, hex color e.g. '#E3CBEF')
- Returns: full Calendar object (same shape as entries in calendars/list)
- `tint_color` is write-only — appears in request but NOT in response
- Fields like location, coordinate, social handles are not settable via create — returned as defaults/nulls

### Organization Endpoint Gotchas
- All org endpoints require org-scoped API key (500 req/min rate limit)
- No organization CRUD — org is implicit from API key
- No list-members endpoint for org — only calendar-level membership
- No update/delete for org calendars
- Events list returns a richer object than regular event GET (includes description_md, registration_questions, feedback_email, calendar_id)
- `sort_direction` enum includes space-containing values: "asc nulls last", "desc nulls last"
- Transfer endpoint has no rollback mechanism

## Webhook Endpoints Detail

### GET /v1/webhooks/list (List Webhooks)
- Query params: `pagination_cursor` (optional), `pagination_limit` (optional)
- Returns: paginated `{ entries: [Webhook], has_more, next_cursor }`
- `next_cursor` only present when `has_more` is true

### GET /v2/webhooks/get (Get Webhook)
- Query params: `id` (required)
- Returns: flat Webhook object (NOT wrapped)

### POST /v2/webhooks/create (Create Webhook)
- Body: `url` (required, format: uri, pattern: "^http.*"), `event_types` (required, string[], minItems: 1, enum values)
- Returns: flat Webhook object

### POST /v2/webhooks/update (Update Webhook)
- Body: `id` (required), `event_types` (optional, string[], minItems: 1), `status` (optional, enum: active/paused)
- Returns: flat Webhook object
- Note: `url` is NOT updatable — only event_types and status can be changed

### POST /v1/webhooks/delete (Delete Webhook)
- Body: `id` (required)
- Returns: empty `{}`

### Webhook Object Shape
```json
{
  "id": "string",
  "url": "string",
  "event_types": ["string"],
  "status": "active | paused",
  "secret": "string",
  "created_at": "ISO 8601 datetime"
}
```
All 6 fields are required in every response.

### Event Types Enum (9 values)
- `*` — wildcard, subscribe to all
- `calendar.event.added`
- `calendar.person.subscribed`
- `event.canceled`
- `event.created`
- `event.updated`
- `guest.registered`
- `guest.updated`
- `ticket.registered`

### Webhook Security
- Signing secret prefix: `whsec_`
- Headers on delivery: `Webhook-Signature` (format: `t=<timestamp>,v1=<signature>`), `Webhook-Id`, `Webhook-Timestamp`
- Verification: HMAC-SHA256 of `"{timestamp}.{raw_body}"` with base64-decoded secret
- Secret returned on every GET/list response (not just create)

### Webhook Retry Policy
- Max 3 retries with exponential backoff: 1min, 2min, 4min
- HTTP 410 Gone auto-pauses the webhook
- 5-second timeout for endpoint responses
- Must return 2xx for acknowledgment

### Webhook Endpoint Gotchas
- Mixed API versions: list and delete are v1; get, create, update are v2
- URL is not updatable after creation (must delete and recreate)
- Delete uses POST method (consistent with Luma's pattern)
- List wraps in entries/has_more/next_cursor; get/create/update return flat objects
- Status enum: only "active" or "paused"
- Webhook ID prefix: `wbhk`
- Webhooks exclusively available to Luma Plus subscribers

## Utility Endpoints Detail

### GET /v1/users/get-self (Get Authenticated User)
- No query params, no body — user determined by API key
- Returns flat user object (NOT wrapped):
  - `id` (string, required)
  - `name` (string | null)
  - `avatar_url` (string, required)
  - `email` (string, required)
  - `first_name` (string | null)
  - `last_name` (string | null)
  - `api_id` (string, deprecated — use `id`)

### GET /v1/entity/lookup (Lookup Entity by Slug)
- Query params: `slug` (string, required) — the URL path portion from lu.ma/<slug>
- Returns: `{ entity: CalendarEntity | EventEntity | null }`
- Discriminated union on `entity.type`:
  - `type: "calendar"` → `{ type, calendar: { id, api_id, name, slug (nullable), avatar_url (nullable) } }`
  - `type: "event"` → `{ type, event: { id, api_id, name, slug, cover_url, start_at, end_at } }`
  - `null` → slug not found, returns `{ entity: null }`
- Note: `entity.type` itself can be null per OpenAPI spec (unrecognized entity type)

### POST /v1/images/create-upload-url (Create Image Upload URL)
- Body: `content_type` (optional, enum: "image/jpeg" | "image/png" | null)
- Returns: `{ upload_url, file_url }`
  - `upload_url` — presigned URL to PUT image binary data to
  - `file_url` — permanent CDN URL where image will be accessible after upload
- Two-step workflow: (1) call this endpoint, (2) PUT binary data to upload_url
- Only JPEG and PNG supported

### Utility Endpoint Gotchas
- get-self has no params — entirely determined by API key
- entity-lookup returns null for not-found (no error thrown)
- image-upload only generates the URL — actual upload is a separate PUT request to S3
- image-upload content_type is optional but recommended

## Event Coupon Endpoints Detail

### GET /v1/event/coupons (List Event Coupons)
- Query params: `event_id` (functionally required, evt-xxx), `pagination_cursor` (optional), `pagination_limit` (optional), `event_api_id` (deprecated)
- Returns: paginated `{ entries: [Coupon], has_more, next_cursor }`
- Coupon shape: same as calendar coupons — `{ id, api_id, code, remaining_count, valid_start_at, valid_end_at, percent_off, cents_off, currency, event_ticket_type_id? }`
- `event_ticket_type_id` is NOT in the `required` array — may be absent (not just null) for non-ticket-restricted coupons

### POST /v1/events/coupons/create (Create Event Coupon)
- Note: path uses plural `/v1/events/` (inconsistency with singular list path)
- Body: `event_id` (required), `code` (required, 1-20 chars), `discount` (required, oneOf: `{discount_type:"percent", percent_off}` or `{discount_type:"amount", cents_off, currency}`), `remaining_count` (optional, 0-1000000), `valid_start_at` (optional), `valid_end_at` (optional), `event_ticket_type_id` (optional — restricts to ticket type; if hidden, creates unlock code)
- Returns: created Coupon object (same shape as list entries)
- Coupon terms (discount, code, event_ticket_type_id) are immutable after creation

### POST /v1/event/update-coupon (Update Event Coupon)
- Note: path uses singular `/v1/event/` and different structure (`update-coupon` not `coupons/update`)
- Body: `code` (required — identifies coupon), `event_id` (optional but functionally needed), `event_api_id` (deprecated), `remaining_count` (optional), `valid_start_at` (optional), `valid_end_at` (optional)
- Returns: empty `{}`
- Cannot change discount amount/type, code, or event_ticket_type_id

### Event Coupon Endpoint Gotchas
- Path inconsistency: list is `/v1/event/coupons` (singular), create is `/v1/events/coupons/create` (plural), update is `/v1/event/update-coupon` (different structure)
- No delete endpoint — disable by setting remaining_count to 0 or valid_end_at to past date
- Update identifies by `code` not `id`
- Create remaining_count caps at 1,000,000; update allows full JS safe integer range
- Create returns full coupon object; update returns empty `{}`
- Coupon response flattens discount: no `discount_type` field, just `percent_off`/`cents_off`/`currency`
- Warning: "Be careful not to have the same code on an event and on the calendar"

## Reference Projects in Codebase
- `nori-newsletter-cli`: commander + TypeScript + vitest, factory functions for DI, Output abstraction, services/ layer
- `nori-slack-cli`: Same patterns, includes paginate.ts and suggest.ts utilities

## Technology Stack Decision
- commander (CLI framework) — matches reference projects
- TypeScript + ESM — matches reference projects
- vitest — matches reference projects
- Node built-in fetch — no SDK exists, native fetch sufficient for REST JSON API
- tsx — dev runner, matches reference projects

## Agentic CLI Convention Gaps (identified 2026-06-09)

### Verified: All 61 API endpoints are implemented
Cross-checked implementation against OpenAPI spec at public-api.luma.com/openapi.json. All endpoints covered.

### Gap: Leaf subcommands missing source location
Only group-level commands (events, guests, etc.) have `.addHelpText("after", ...)`. Individual subcommands like `events list`, `guests get`, etc. do NOT show source location in `--help`. The building-agentic-cli skill requires source location on EVERY subcommand.

### Gap: No structured JSON error output
When commands fail (unknown command, missing option, API error), output is plain text from Commander. The nori-slack-cli reference has structured `{ ok: false, error, message, suggestion, source }` JSON errors. For an agentic consumer, structured JSON errors are far more parseable.

### Gap: No source location or "look at source" instructions on error
The building-agentic-cli skill requires: "the source location and instructions to look at the source if anything is confusing" on mistaken input. Currently absent from error output.

### nori-slack-cli reference patterns
- `errors.ts`: `CliError` interface with `{ ok, error, message, suggestion, source }`. `formatError()` maps error types to structured JSON with context-specific suggestions.
- `suggest.ts`: Custom Levenshtein distance implementation. `findSimilarMethods()` with dynamic threshold `Math.min(5, Math.max(2, Math.floor(input.length * 0.3)))`, returns up to 3 similar matches.
- Commander's `.showSuggestionAfterError(true)` is used in nori-luma-cli but nori-slack-cli implements its own Levenshtein for richer control.
