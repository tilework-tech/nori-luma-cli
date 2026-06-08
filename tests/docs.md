# Noridoc: tests

Path: @/tests

### Overview

- Contains all tests for the CLI, run via Vitest (`npm test`)
- Uses a shared test harness (`helpers.ts`) that provides a mock service, test output capture, and a `runCommand` function that exercises the full Commander pipeline without touching the network or process globals

### How it fits into the larger codebase

- Tests import `createProgram` from `@/src/program.ts` and wire it with mock dependencies -- this means tests exercise the real Commander parsing, option validation, and command routing
- The `LumaService` interface from `@/src/services/luma.ts` is the contract that both the real HTTP client and the mock service implement; tests validate command behavior against this contract
- Test structure mirrors source structure: `@/tests/program.test.ts` tests the root program, `@/tests/commands/` has a test file per command group (events, guests, hosts)

### Core Implementation

- **`helpers.ts`** is the test infrastructure backbone, providing:
  - `createMockLumaService()` -- Returns a `LumaService` implementation backed by in-memory Maps (`.events`, `.cancellationTokens`, `.guests`, `.hosts`) for direct state manipulation in test setup
  - `createTestOutput()` -- Returns an `Output` implementation that accumulates writes into `.stdout` and `.stderr` string properties
  - `runCommand(luma, args)` -- Full integration helper: creates test output, builds the program, applies `exitOverride()` to all commands, runs `parseAsync`, and returns `{ stdout, stderr, exitCode }`
  - `makeEvent()` and `makeGuest()` -- Factory functions for `LumaEvent` and `LumaGuest` objects with sensible defaults and partial override support
  - `MockHost` interface -- Defines the shape used by the mock service's `.hosts` Map (includes `is_creator` flag for testing creator-removal protection)
- **`program.test.ts`** -- Tests root-level behavior: help output content, source location display, misspelled command suggestions, unknown command error handling
- **`commands/`** -- Each command group has its own test file covering happy paths, missing required flags, error handling, and edge cases (e.g., the two-step cancel flow, repeatable email flags, mutually exclusive guest identifier flags)

### Things to Know

- `applyExitOverride` in `helpers.ts` recursively calls `exitOverride()` on every command in the tree -- without this, Commander calls `process.exit()` on errors, which would kill the test runner. The `runCommand` catch block checks for Commander's special `exitCode` property on the thrown error object
- The mock service implements real filtering and cursor-based pagination using array indices -- this is enough to test the CLI's pass-through behavior but is not a full replica of the Luma API's sorting/filtering semantics
- The mock service's host operations enforce creator protection (cannot modify or remove a host with `is_creator: true`), mirroring the real API constraint
- Tests parse the captured `stdout` string as JSON to make assertions on the structured output, which validates that the CLI produces valid JSON end-to-end

Created and maintained by Nori.
