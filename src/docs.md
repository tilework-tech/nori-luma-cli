# Noridoc: src

Path: @/src

### Overview

- Contains all production source code for the CLI: entry point, program assembly, command definitions, service clients, and shared abstractions
- Organized by responsibility: top-level files handle wiring and cross-cutting concerns, `commands/` holds CLI command groups, `services/` holds API client implementations

### How it fits into the larger codebase

- `@/src/index.ts` is the process entry point, executed either via `tsx` (dev) or compiled `dist/index.js` (production)
- Tests in `@/tests/` import directly from this directory -- they use `createProgram()` from `@/src/program.ts` and types/interfaces from `@/src/services/luma.ts` and `@/src/output.ts`
- The dependency injection wiring happens here: `index.ts` creates concrete implementations (`createProcessOutput`, `createLumaService`) and passes them into `createProgram`, which passes them into each command factory

### Core Implementation

- **`index.ts`** -- Entry point. Loads config, creates service and output, runs Commander. Has a single try/catch at the process boundary to handle missing API key or unexpected startup errors
- **`program.ts`** -- Builds the Commander `Command` tree. Registers all command groups (currently just `events`). Recursively applies `configureCommandOutput` to redirect all Commander output through the `Output` interface
- **`output.ts`** -- Defines the `Output` interface (`write`, `error`, `setExitCode`) and the `createProcessOutput` factory that maps to `process.stdout`/`process.stderr`. This is the seam that makes the entire CLI testable without process-level mocking
- **`config.ts`** -- Reads `LUMA_API_KEY` from `process.env`. Throws a descriptive error if missing. Returns a `LumaConfig` object. No other config sources exist yet

### Things to Know

- All internal imports use `.js` extensions (e.g., `import { loadConfig } from "./config.js"`) because of Node16 module resolution -- this is required even though the actual source files are `.ts`
- The `Output` interface is intentionally minimal (write/error/setExitCode) and does not include formatting or logging levels -- commands are responsible for JSON-serializing their own output
- `configureCommandOutput` in `program.ts` disables colors and redirects writes for the root command and all subcommands recursively; this must be called after all commands are registered or new commands will bypass the redirect
- The try/catch in `index.ts` is the only process-boundary error handler; individual commands handle their own errors (writing to stderr and setting exit codes) without rethrowing

Created and maintained by Nori.
