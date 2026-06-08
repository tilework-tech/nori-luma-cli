# Noridoc: tests

Path: @/tests

### Overview

- Contains all tests for the CLI, run via Vitest (`npm test`)
- Uses a shared test harness (`helpers.ts`) that provides a mock service, test output capture, and a `runCommand` function that exercises the full Commander pipeline without touching the network or process globals

### How it fits into the larger codebase

- Tests import `createProgram` from `@/src/program.ts` and wire it with mock dependencies -- this means tests exercise the real Commander parsing, option validation, and command routing
- The `LumaService` interface from `@/src/services/luma.ts` is the contract that both the real HTTP client and the mock service implement; tests validate command behavior against this contract
- Test structure mirrors source structure: `@/tests/program.test.ts` tests the root program, `@/tests/commands/events.test.ts` tests the events command group

### Core Implementation

- **`helpers.ts`** is the test infrastructure backbone, providing three key exports:
  - `createMockLumaService()` -- Returns a `LumaService` implementation backed by `Map<string, LumaEvent>` with exposed `.events` and `.cancellationTokens` maps for direct state manipulation in test setup
  - `createTestOutput()` -- Returns an `Output` implementation that accumulates writes into `.stdout` and `.stderr` string properties
  - `runCommand(luma, args)` -- Full integration helper: creates test output, builds the program, applies `exitOverride()` to all commands, runs `parseAsync`, and returns `{ stdout, stderr, exitCode }`
- **`program.test.ts`** -- Tests root-level behavior: help output content, source location display, misspelled command suggestions, unknown command error handling
- **`commands/events.test.ts`** -- Tests each events subcommand (list, get, create, update, cancel) including happy paths, missing required flags, not-found errors, pagination, and the two-step cancel flow

### Things to Know

- `applyExitOverride` in `helpers.ts` recursively calls `exitOverride()` on every command in the tree -- without this, Commander calls `process.exit()` on errors, which would kill the test runner. The `runCommand` catch block checks for Commander's special `exitCode` property on the thrown error object
- `makeEvent()` provides a factory for `LumaEvent` objects with sensible defaults and partial override support -- tests use this to seed the mock service's `events` Map directly (e.g., `luma.events.set("evt-1", makeEvent({ api_id: "evt-1" }))`)
- The mock service's `listEvents` implements real filtering (`after`/`before` on `start_at`) and cursor-based pagination using array indices -- this is enough to test the CLI's pass-through behavior but is not a full replica of the Luma API's sorting/filtering semantics
- Tests parse the captured `stdout` string as JSON to make assertions on the structured output, which validates that the CLI produces valid JSON end-to-end

Created and maintained by Nori.
