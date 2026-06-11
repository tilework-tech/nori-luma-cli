import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const require = createRequire(import.meta.url);
const { version: packageVersion } = require("../package.json") as { version: string };

async function runCliWithoutApiKey(args: string[]) {
  const env = { ...process.env };
  delete env.LUMA_API_KEY;

  try {
    const result = await execFileAsync(
      process.execPath,
      ["node_modules/tsx/dist/cli.mjs", "src/index.ts", ...args],
      { env }
    );
    return { exitCode: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (err) {
    const error = err as {
      code?: number;
      stdout?: string;
      stderr?: string;
    };
    return {
      exitCode: error.code ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    };
  }
}

describe("cli startup", () => {
  it("shows help without requiring LUMA_API_KEY", async () => {
    const result = await runCliWithoutApiKey(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Usage: nori-luma");
    expect(result.stdout).toContain("Commands:");
    expect(result.stderr).not.toContain("LUMA_API_KEY");
  });

  it("shows command help without requiring LUMA_API_KEY", async () => {
    const result = await runCliWithoutApiKey(["events", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Usage: nori-luma events");
    expect(result.stdout).toContain("list");
    expect(result.stderr).not.toContain("LUMA_API_KEY");
  });

  it("shows version without requiring LUMA_API_KEY", async () => {
    const result = await runCliWithoutApiKey(["--version"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(packageVersion);
    expect(result.stderr).not.toContain("LUMA_API_KEY");
  });

  it("shows help and API key instructions when run with no arguments", async () => {
    const result = await runCliWithoutApiKey([]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Usage: nori-luma");
    expect(result.stdout).toContain("Commands:");
    expect(result.stdout).toContain("Get your API key from");
    expect(result.stderr).not.toContain("environment variable is required");
  });

  it("still requires LUMA_API_KEY for API commands", async () => {
    const result = await runCliWithoutApiKey(["utility", "get-self"]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("LUMA_API_KEY environment variable is required");
  });
});
