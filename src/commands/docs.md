# Noridoc: commands

Path: @/src/commands

### Overview

- Contains CLI command group definitions, each exported as a factory function that receives `LumaService` and `Output` and returns a Commander `Command`
- Command groups cover the main Luma domain entities: events (CRUD + cancel), guests (list, get, add, update status, send invites), hosts (add, update, remove), ticket-types (CRUD + delete), and calendar (settings, admins, coupons, event tags, event submissions)

### How it fits into the larger codebase

- `@/src/program.ts` calls each command factory (e.g., `createEventsCommand`, `createGuestsCommand`, `createHostsCommand`, `createTicketTypesCommand`, `createCalendarCommand`) and attaches the result to the root Commander program via `addCommand`
- Command factories depend on the `LumaService` interface from `@/src/services/luma.ts` and the `Output` interface from `@/src/output.ts` -- they never import concrete implementations
- Tests in `@/tests/commands/` exercise these commands end-to-end through the `runCommand` helper, which passes a mock `LumaService` into `createProgram`

### Core Implementation

- Each command file exports a `create<Group>Command(luma, out)` factory that builds a Commander command with subcommands
- Subcommands follow a standard pattern: parse CLI flags -> call a `LumaService` method -> write JSON to `out.write()` on success or `out.error()` + `out.setExitCode(1)` on failure
- Read operations (e.g., `events list`, `guests get`) output the full API response as JSON. Write-only operations where the API returns empty `{}` (e.g., `guests add`, `hosts add`, `hosts remove`, `ticket-types delete`, `calendar approve-event`, `calendar reject-event`, `calendar update-coupon`, `calendar update-event-tag`, `calendar delete-event-tag`) output confirmation JSON like `{ approved: true, calendar_event_id }` or `{ deleted: true }` instead
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
- All output is JSON via `JSON.stringify(result, null, 2)` -- there is no table or human-friendly formatting mode

Created and maintained by Nori.
