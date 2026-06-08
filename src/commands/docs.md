# Noridoc: commands

Path: @/src/commands

### Overview

- Contains CLI command group definitions, each exported as a factory function that receives `LumaService` and `Output` and returns a Commander `Command`
- Currently has one command group (`events`) covering CRUD operations and cancellation for Luma events

### How it fits into the larger codebase

- `@/src/program.ts` calls each command factory (e.g., `createEventsCommand`) and attaches the result to the root Commander program via `addCommand`
- Command factories depend on the `LumaService` interface from `@/src/services/luma.ts` and the `Output` interface from `@/src/output.ts` -- they never import concrete implementations
- Tests in `@/tests/commands/` exercise these commands end-to-end through the `runCommand` helper, which passes a mock `LumaService` into `createProgram`

### Core Implementation

- **`events.ts`** -- Exports `createEventsCommand(luma, out)` which builds a Commander command with subcommands: `list`, `get`, `create`, `update`, `cancel`
- Each subcommand follows the same pattern: parse CLI flags -> call a `LumaService` method -> write JSON to `out.write()` on success or `out.error()` + `out.setExitCode(1)` on failure
- `list` and `create` let errors propagate (they will be caught by Commander or the process-level handler in `index.ts`); `get`, `update`, and `cancel` catch errors locally and write to stderr
- The `cancel` subcommand implements Luma's two-step cancellation: calls `requestCancellation` to obtain a `cancellation_token`, then calls `cancelEvent` with that token. Both steps happen within a single command invocation
- Commander's `requiredOption` enforces mandatory flags (e.g., `--id` for get, `--name`/`--start-at`/`--timezone` for create); missing required options cause Commander to exit with a non-zero code and error message

### Things to Know

- Commander auto-converts kebab-case flags to camelCase in the `opts` object (e.g., `--start-at` becomes `opts.startAt`, `--event-id` becomes `opts.eventId`), but the Luma API expects snake_case -- the command action handlers perform this mapping explicitly
- The inconsistency in error handling (some subcommands catch locally, others don't) is a known pattern in the current code; `list` and `create` rely on upstream error handling while `get`, `update`, and `cancel` handle errors themselves
- All output is JSON via `JSON.stringify(result, null, 2)` -- there is no table or human-friendly formatting mode
- The `--limit` and `--max-capacity` flags use `parseInt` as Commander's value parser to convert string input to numbers

Created and maintained by Nori.
