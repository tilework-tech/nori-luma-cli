#!/usr/bin/env node

import { loadConfig } from "./config.js";
import { createProcessOutput } from "./output.js";
import { createProgram } from "./program.js";
import { createLumaService } from "./services/luma.js";

const out = createProcessOutput();

try {
  const config = loadConfig();
  const luma = createLumaService(config.apiKey);
  const program = createProgram(luma, out);
  await program.parseAsync();
} catch (err) {
  out.error(String(err) + "\n");
  process.exitCode = 1;
}
