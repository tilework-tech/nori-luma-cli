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
    const output = result.stderr + result.stdout;
    expect(output).toMatch(/did you mean/i);
  });

  it("shows detailed error for unknown commands", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, ["nonexistent"]);
    expect(result.exitCode).not.toBe(0);
  });

  it("shows source location in error output for unknown command", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, ["nonexistent"]);
    const output = result.stderr + result.stdout;
    expect(output).toMatch(/source:/i);
  });

  it("shows 'look at the source' instructions in error output", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, ["nonexistent"]);
    const output = result.stderr + result.stdout;
    expect(output).toMatch(/look at the source/i);
  });

  it("shows source location in leaf subcommand help", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, ["events", "list", "--help"]);
    expect(result.stdout).toMatch(/source:/i);
  });

  it("shows source location in error for missing required option", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, ["events", "get"]);
    const output = result.stderr + result.stdout;
    expect(output).toMatch(/source:/i);
  });

  it("shows suggestion for misspelled subcommand", async () => {
    const luma = createMockLumaService();
    const result = await runCommand(luma, ["events", "listt"]);
    const output = result.stderr + result.stdout;
    expect(output).toMatch(/did you mean/i);
  });
});
