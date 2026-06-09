# Noridoc: commands

Path: @/src/commands

### Overview

- Contains CLI command group definitions, each exported as a factory function that receives `LumaService` and `Output` and returns a Commander `Command`
- Command groups cover all Luma domain entities and utility endpoints: events (CRUD + cancel), guests (list, get, add, update status, send invites), hosts (add, update, remove), ticket-types (CRUD + delete), calendar (settings, admins, coupons, event tags, event submissions), contacts (list, import, contact tags CRUD, tag apply/unapply), membership (list tiers, add member, update member status), organization (org admins, org calendars, org events, transfer events, create calendars), webhook (list, get, create, update, delete), and utility (get-self, entity-lookup, image-upload)

### How it fits into the larger codebase

- `@/src/program.ts` calls each `create*Command(luma, out)` factory and attaches the result to the root Commander program via `addCommand`
- Command factories depend on the `LumaService` interface from `@/src/services/luma.ts` and the `Output` interface from `@/src/output.ts` -- they never import concrete implementations
- Tests in `@/tests/commands/` exercise these commands end-to-end through the `runCommand` helper, which passes a mock `LumaService` into `createProgram`

### Core Implementation

- Each command file exports a `create<Group>Command(luma, out)` factory that builds a Commander command with subcommands
- Subcommands follow a standard pattern: parse CLI flags -> call a `LumaService` method -> write JSON to `out.write()` on success or `out.error()` + `out.setExitCode(1)` on failure
- Read operations (e.g., `events list`, `guests get`) output the full API response as JSON. Write-only operations where the API returns empty `{}` (e.g., `guests add`, `hosts add`, `hosts remove`, `ticket-types delete`, `calendar approve-event`, `calendar reject-event`, `contacts import`, `contacts update-contact-tag`, `contacts delete-contact-tag`) output confirmation JSON like `{ approved: true, calendar_event_id }` or `{ deleted: true }` instead
- The `events cancel` subcommand implements Luma's two-step cancellation: calls `requestCancellation` to obtain a `cancellation_token`, then calls `cancelEvent` with that token, both within a single command invocation
- Commander's `requiredOption` enforces mandatory flags; missing required options cause Commander to exit with a non-zero code and error message

### Things to Know

- Commander auto-converts kebab-case flags to camelCase in the `opts` object (e.g., `--start-at` becomes `opts.startAt`), but the Luma API expects snake_case -- the command action handlers perform this mapping explicitly
- The `--email` flag in `guests add` and `guests send-invites` is repeatable (uses a `collectEmails` function to accumulate values into an array). Because Commander's `requiredOption` does not work with collect-style options, these commands manually validate that at least one email was provided and emit an error if not
- The `guests update-status` command builds a discriminated union (`{type: "email", email}` or `{type: "api_id", api_id}`) from mutually exclusive `--guest-email` / `--guest-id` flags, with manual validation that at least one is provided
- The `hosts` commands use Commander's `--no-visible` negation flag pattern, which sets `opts.visible` to `false` when present -- the command maps this to the API's `is_visible` field
- The `ticket-types create` and `ticket-types update` commands use Commander's boolean flag negation pattern (`--hidden`/`--no-hidden`, `--flexible`/`--no-flexible`, `--require-approval`/`--no-require-approval`). Because Commander sets negated flags to `false` (not `undefined`), the action handlers use an explicit `!== undefined` guard to distinguish "user didn't pass the flag" from "user passed `--no-hidden`"
- The `ticket-types list` endpoint has no pagination (unlike events/guests) -- ticket types are few per event, so the response is `{ entries: LumaTicketType[] }` rather than `PaginatedResponse<T>`
- The `calendar add-event` command builds a discriminated union on `--platform`: `luma` sends `event_id` and `submission_mode`, while `external` sends `url`, `name`, `start_at`, `duration_interval`, `timezone`, and optional `host`. This branching happens in the command action handler before calling `luma.addEventToCalendar`
- The `calendar create-coupon` command similarly discriminates on `--discount-type`: `percent` sends `percent_off`, while `amount` sends `cents_off` and `currency`. The discriminated discount object is nested inside the `CreateCouponParams`
- The `calendar apply-event-tag` and `calendar unapply-event-tag` commands accept `--event-ids` as a comma-separated string, which the command action splits into an array before calling the service. The `--tag` flag accepts either a tag ID or tag name
- The `calendar list-admins`, `calendar list-event-tags` endpoints have no pagination. The `calendar list-coupons` endpoint uses cursor-based pagination (same as `events list` and `guests list`)
- The `contacts` command group mirrors the pattern of `calendar` event tags for contact tags: `apply-contact-tag` and `unapply-contact-tag` accept `--tag` (ID or name) and identify contacts via `--emails` or `--user-ids` as comma-separated strings, split into arrays in the action handler. The `contacts import` command maps positional `--names` to `--emails` by array index, building a `{ email, name? }[]` for the service
- The `contacts list` command passes `--tags` as comma-separated values that get split into an array, unlike most other list commands that use simple scalar filters. The `listContacts` service method handles these as repeated query params (via `url.searchParams.append`) rather than a single comma-joined value
- The `membership update-member-status` command constructs its own confirmation JSON (`{ updated: true, user_id, status }`) because the Luma API returns an empty response for this endpoint. The `membership add-member` command maps `--skip-payment` to `undefined` (not `false`) when absent, so the field is omitted from the API request body
- The `organization` command group manages org-level resources (requires an org-scoped API key). `list-admins` has no pagination (returns all admins). `list-calendars` and `list-events` use cursor-based pagination. `transfer-event` returns no data from the API, so the command outputs synthetic confirmation JSON (`{ transferred: true, event_id, calendar_id }`). `create-calendar` uses a v2 API endpoint (`/v2/organizations/calendars/create`) and accepts an optional `--tint-color` that is write-only (sent to the API but not present in the response). The `LumaOrgEvent` type returned by `list-events` is richer than the standard `LumaEvent` (includes `calendar_id`, `description_md`, `registration_questions`, `visibility`, `feedback_email`)
- The `webhook` command group manages webhook endpoints for receiving event notifications. `list` uses cursor-based pagination. `get`, `create`, and `update` return the full `LumaWebhook` object (including `secret`). `delete` returns no data from the API, so the command outputs synthetic confirmation JSON (`{ deleted: true, id }`). The `--event-types` flag on `create` and `update` accepts a comma-separated string that the action handler splits into an array before calling the service. The webhook API uses mixed v1/v2 paths: `list` and `delete` use `/v1/webhooks/`, while `get`, `create`, and `update` use `/v2/webhooks/`
- The `utility` command group provides account-level and cross-entity operations that do not belong to a specific domain group. `get-self` takes no arguments and returns the authenticated user (`LumaUser`). `entity-lookup` resolves a lu.ma URL slug to either a calendar or event via a discriminated `LumaEntity` (the `type` field indicates which shape the response carries). `image-upload` returns a presigned upload URL and the final CDN file URL; `--content-type` is optional (defaults to server-side behavior when omitted)
- All output is JSON via `JSON.stringify(result, null, 2)` -- there is no table or human-friendly formatting mode

Created and maintained by Nori.
