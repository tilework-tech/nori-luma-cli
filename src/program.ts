import { Command } from "commander";
import type { LumaService } from "./services/luma.js";
import type { Output } from "./output.js";
import { createEventsCommand } from "./commands/events.js";
import { createGuestsCommand } from "./commands/guests.js";
import { createHostsCommand } from "./commands/hosts.js";
import { createTicketTypesCommand } from "./commands/ticket-types.js";
import { createCalendarCommand } from "./commands/calendar.js";
import { createContactsCommand } from "./commands/contacts.js";
import { createMembershipCommand } from "./commands/membership.js";
import { createOrganizationCommand } from "./commands/organization.js";
import { createWebhookCommand } from "./commands/webhook.js";
import { createUtilityCommand } from "./commands/utility.js";

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
  program.addCommand(createGuestsCommand(luma, out));
  program.addCommand(createHostsCommand(luma, out));
  program.addCommand(createTicketTypesCommand(luma, out));
  program.addCommand(createCalendarCommand(luma, out));
  program.addCommand(createContactsCommand(luma, out));
  program.addCommand(createMembershipCommand(luma, out));
  program.addCommand(createOrganizationCommand(luma, out));
  program.addCommand(createWebhookCommand(luma, out));
  program.addCommand(createUtilityCommand(luma, out));

  configureCommandOutput(program, out);

  return program;
}
