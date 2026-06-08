import { describe, it, expect } from "vitest";
import { createMockLumaService, runCommand } from "./helpers.js";

describe("program", () => {
  it("shows help with tool description when invoked with no args", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, []);
    const output = result.stdout + result.stderr;
    expect(output).toContain("nori-luma");
    expect(output).toContain("Use this CLI tool to");
    expect(output).toContain("events");
  });

  it("shows help when invoked with --help", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, ["--help"]);
    expect(result.stdout).toContain("nori-luma");
    expect(result.stdout).toContain("Use this CLI tool to");
  });

  it("shows source location in help output", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, ["--help"]);
    expect(result.stdout).toMatch(/source:/i);
  });

  it("shows suggestion for misspelled commands", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, ["evnts"]);
    expect(result.stderr + result.stdout).toMatch(/did you mean/i);
  });

  it("shows detailed error for unknown commands", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, ["nonexistent"]);
    expect(result.exitCode).not.toBe(0);
  });
});
