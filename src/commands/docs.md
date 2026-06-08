# Noridoc: commands

Path: @/src/commands

### Overview

- Contains CLI command group definitions, each exported as a factory function that receives `LumaService` and `Output` and returns a Commander `Command`
- Command groups cover the main Luma domain entities: events (CRUD + cancel), guests (list, get, add, update status, send invites), and hosts (add, update, remove)

### How it fits into the larger codebase

- `@/src/program.ts` calls each command factory (e.g., `createEventsCommand`, `createGuestsCommand`, `createHostsCommand`) and attaches the result to the root Commander program via `addCommand`
- Command factories depend on the `LumaService` interface from `@/src/services/luma.ts` and the `Output` interface from `@/src/output.ts` -- they never import concrete implementations
- Tests in `@/tests/commands/` exercise these commands end-to-end through the `runCommand` helper, which passes a mock `LumaService` into `createProgram`

### Core Implementation

- Each command file exports a `create<Group>Command(luma, out)` factory that builds a Commander command with subcommands
- Subcommands follow a standard pattern: parse CLI flags -> call a `LumaService` method -> write JSON to `out.write()` on success or `out.error()` + `out.setExitCode(1)` on failure
- Read operations (e.g., `events list`, `guests get`) output the full API response as JSON. Write-only operations where the API returns empty `{}` (e.g., `guests add`, `hosts add`, `hosts remove`) output confirmation JSON like `{ added: true, event_id }` instead
- The `events cancel` subcommand implements Luma's two-step cancellation: calls `requestCancellation` to obtain a `cancellation_token`, then calls `cancelEvent` with that token, both within a single command invocation
- Commander's `requiredOption` enforces mandatory flags; missing required options cause Commander to exit with a non-zero code and error message

### Things to Know

- Commander auto-converts kebab-case flags to camelCase in the `opts` object (e.g., `--start-at` becomes `opts.startAt`), but the Luma API expects snake_case -- the command action handlers perform this mapping explicitly
- The `--email` flag in `guests add` and `guests send-invites` is repeatable (uses a `collectEmails` function to accumulate values into an array). Because Commander's `requiredOption` does not work with collect-style options, these commands manually validate that at least one email was provided and emit an error if not
- The `guests update-status` command builds a discriminated union (`{type: "email", email}` or `{type: "api_id", api_id}`) from mutually exclusive `--guest-email` / `--guest-id` flags, with manual validation that at least one is provided
- The `hosts` commands use Commander's `--no-visible` negation flag pattern, which sets `opts.visible` to `false` when present -- the command maps this to the API's `is_visible` field
- All output is JSON via `JSON.stringify(result, null, 2)` -- there is no table or human-friendly formatting mode

Created and maintained by Nori.
