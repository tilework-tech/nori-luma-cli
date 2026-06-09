# Noridoc: tests

Path: @/tests

### Overview

- Contains all tests for the CLI, run via Vitest (`npm test`)
- Uses a shared test harness (`helpers.ts`) that provides a mock service, test output capture, and a `runCommand` function that exercises the full Commander pipeline without touching the network or process globals

### How it fits into the larger codebase

- Tests import `createProgram` from `@/src/program.ts` and wire it with mock dependencies -- this means tests exercise the real Commander parsing, option validation, and command routing
- The `LumaService` interface from `@/src/services/luma.ts` is the contract that both the real HTTP client and the mock service implement; tests validate command behavior against this contract
- Test structure mirrors source structure: `@/tests/program.test.ts` tests the root program, `@/tests/commands/` has a test file per command group (events, guests, hosts, ticket-types, calendar, contacts, membership)

### Core Implementation

- **`helpers.ts`** is the test infrastructure backbone, providing:
  - `createMockLumaService()` -- Returns a `LumaService` implementation backed by in-memory Maps (`.events`, `.cancellationTokens`, `.guests`, `.hosts`, `.ticketTypes`, `.members`) and arrays (`.calendarAdmins`, `.calendarCoupons`, `.eventTags`, `.calendarEvents`, `.contacts`, `.contactTags`, `.membershipTiers`) for direct state manipulation in test setup. Also exposes a `.calendar` object for modifying the calendar returned by `getCalendar`
  - `createTestOutput()` -- Returns an `Output` implementation that accumulates writes into `.stdout` and `.stderr` string properties
  - `runCommand(luma, args)` -- Full integration helper: creates test output, builds the program, applies `exitOverride()` to all commands, runs `parseAsync`, and returns `{ stdout, stderr, exitCode }`
  - Factory functions (`makeEvent()`, `makeGuest()`, `makeTicketType()`, `makeCalendar()`, `makeAdmin()`, `makeCoupon()`, `makeEventTag()`, `makeContact()`, `makeContactTag()`, `makeMembershipTier()`) -- Create domain objects with sensible defaults and partial override support
  - `MockHost` and `MockCalendarEvent` interfaces -- Define shapes used by the mock service's internal stores (e.g., `MockHost` includes `is_creator` for testing creator-removal protection; `MockCalendarEvent` includes `event_id` for lookup matching)
- **`program.test.ts`** -- Tests root-level behavior: help output content, source location display, misspelled command suggestions, unknown command error handling
- **`commands/`** -- Each command group has its own test file covering happy paths, missing required flags, error handling, and edge cases (e.g., the two-step cancel flow, repeatable email flags, mutually exclusive guest identifier flags)

### Things to Know

- `applyExitOverride` in `helpers.ts` recursively calls `exitOverride()` on every command in the tree -- without this, Commander calls `process.exit()` on errors, which would kill the test runner. The `runCommand` catch block checks for Commander's special `exitCode` property on the thrown error object
- The mock service implements real filtering and cursor-based pagination using array indices -- this is enough to test the CLI's pass-through behavior but is not a full replica of the Luma API's sorting/filtering semantics
- The mock service's host operations enforce creator protection (cannot modify or remove a host with `is_creator: true`), mirroring the real API constraint
- The mock service's ticket-type delete operation enforces sold-ticket protection (cannot delete a ticket type with `has_sold_tickets: true`), mirroring the real API constraint. The `.ticketTypes` Map is keyed by event ID and stores arrays of `LumaTicketType`
- The mock service's calendar operations store state in arrays rather than Maps because calendar entities are singletons or small collections. The mock tracks `lastRejectEventParams` (and similarly `lastAddGuestsParams`, `lastSendInvitesParams`, `lastImportContactsParams`, `lastAddMemberParams`, `lastUpdateMemberStatusParams`) so tests can assert on parameters passed to void-returning methods
- The mock's `addEventToCalendar` derives status from `submission_mode`: `"pending"` results in `status: "pending"`, anything else defaults to `"approved"`. The mock's `applyEventTag`/`unapplyEventTag` count events found in the `.events` Map as applied/removed and unfound as skipped. The mock's `applyContactTag`/`unapplyContactTag` similarly count contacts found in the `.contacts` array by email or user_id as applied/removed and unfound as skipped
- The mock's `addMember` validates that the referenced tier exists in `.membershipTiers` (throws 404 if not), stores the member in the `.members` Map keyed by email, and always returns `status: "approved"`. The mock's `updateMemberStatus` does not throw on unknown user IDs -- it silently no-ops if the member is not in the `.members` Map
- Tests parse the captured `stdout` string as JSON to make assertions on the structured output, which validates that the CLI produces valid JSON end-to-end

Created and maintained by Nori.
