# Noridoc: nori-luma-cli

Path: @/

### Overview

- Agent-oriented CLI for the Luma (lu.ma) event platform REST API, designed to be invoked by AI agents rather than humans (no colors, no interactivity, JSON-only output)
- Built with Commander, TypeScript (strict mode), ESM throughout, and tested with Vitest
- Uses a factory-function dependency injection pattern so every layer is testable without mocking globals

### How it fits into the larger codebase

- This is the top-level project root; all source lives in `@/src/` and all tests in `@/tests/`
- `@/src/index.ts` is the CLI entry point -- it wires config, service, and output together then delegates to Commander via `@/src/program.ts`
- The project ships as an npm package with a `nori-luma` bin entry pointing at `./dist/index.js` (compiled from `@/src/index.ts`)
- External dependency surface is intentionally small: only `commander` at runtime; `typescript`, `vitest`, and `tsx` at dev time
- The Luma public API (`https://public-api.luma.com`) is the sole external service; authentication is via the `LUMA_API_KEY` environment variable loaded in `@/src/config.ts`

### Core Implementation

- Startup flow: `index.ts` calls `loadConfig()` -> `createLumaService(apiKey)` -> `createProgram(luma, out)` -> `program.parseAsync()`
- If `LUMA_API_KEY` is missing, the process throws before Commander ever runs, producing a descriptive error with instructions for obtaining a key
- Commander output channels (stdout/stderr, color settings) are globally redirected through the `Output` interface via a recursive `configureCommandOutput` walk over all registered subcommands in `@/src/program.ts`

```
 index.ts
   |
   +-- loadConfig()          @/src/config.ts
   +-- createLumaService()   @/src/services/luma.ts
   +-- createProgram()       @/src/program.ts
         |
         +-- createEventsCommand()  @/src/commands/events.ts
         +-- createGuestsCommand()  @/src/commands/guests.ts
         +-- createHostsCommand()       @/src/commands/hosts.ts
         +-- createTicketTypesCommand()  @/src/commands/ticket-types.ts
```

### Things to Know

- The `Output` abstraction (`@/src/output.ts`) exists specifically so tests can capture stdout/stderr as strings instead of mocking `process.stdout`; the production implementation simply delegates to `process.stdout.write` / `process.stderr.write`
- All CLI output is JSON (pretty-printed with 2-space indent) -- this is a deliberate design choice for agent consumption; there are no human-friendly table views
- Commander's `exitOverride()` is applied in tests (`@/tests/helpers.ts`) to convert Commander's `process.exit()` calls into catchable exceptions, which is how tests assert on exit codes
- The `events cancel` command implements Luma's two-step cancellation protocol: first `requestCancellation` to get a token, then `cancelEvent` with that token -- this is not optional, the API enforces it
- `tsconfig.json` uses `Node16` module resolution, so all internal imports must use `.js` extensions even though source files are `.ts`

Created and maintained by Nori.
