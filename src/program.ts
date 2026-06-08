import { Command } from "commander";
import type { LumaService } from "./services/luma.js";
import type { Output } from "./output.js";
import { createEventsCommand } from "./commands/events.js";

function configureCommandOutput(cmd: Command, out: Output): void {
  cmd.configureOutput({
    getOutHasColors: () => false,
    getErrHasColors: () => false,
    writeOut: (str) => out.write(str),
    writeErr: (str) => out.error(str),
  });
  for (const sub of cmd.commands) {
    configureCommandOutput(sub, out);
  }
}

export function createProgram(luma: LumaService, out: Output): Command {
  const program = new Command();

  program
    .name("nori-luma")
    .version("0.1.0")
    .description(
      "Use this CLI tool to manage events, guests, calendars, and more on the Luma (lu.ma) event platform.\n\n" +
        "Requires LUMA_API_KEY environment variable to be set."
    )
    .showSuggestionAfterError(true)
    .showHelpAfterError(true)
    .addHelpText("after", `\nSource: ${import.meta.dirname}`);

  program.addCommand(createEventsCommand(luma, out));

  configureCommandOutput(program, out);

  return program;
}
