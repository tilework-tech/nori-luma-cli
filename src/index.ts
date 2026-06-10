#!/usr/bin/env node

import { loadConfig } from "./config.js";
import { createProcessOutput } from "./output.js";
import { createProgram } from "./program.js";
import { createLumaService } from "./services/luma.js";

const out = createProcessOutput();

function isHelpOrVersionRequest(args: string[]): boolean {
  return args.some((arg) => arg === "-h" || arg === "--help" || arg === "-V" || arg === "--version");
}

try {
  const args = process.argv.slice(2);
  const showHelpOnly = args.length === 0 || isHelpOrVersionRequest(args);
  const config = showHelpOnly ? { apiKey: "" } : loadConfig();
  const luma = createLumaService(config.apiKey);
  const program = createProgram(luma, out);
  if (args.length === 0) {
    program.outputHelp();
  } else {
    await program.parseAsync();
  }
} catch (err) {
  out.error(String(err) + "\n");
  process.exitCode = 1;
}
