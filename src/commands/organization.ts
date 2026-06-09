import { Command } from "commander";
import type { LumaService } from "../services/luma.js";
import type { Output } from "../output.js";
import { parseIntStrict } from "../parse.js";

export function createOrganizationCommand(luma: LumaService, out: Output): Command {
  const organization = new Command("organization")
    .description("Manage organization admins, calendars, and events. Use this to list org resources, transfer events between calendars, and create new calendars.")

  organization
    .command("list-admins")
    .description("List organization admins")
    .action(async () => {
      const result = await luma.listOrgAdmins();
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  organization
    .command("list-calendars")
    .description("List calendars belonging to the organization")
    .option("--limit <number>", "Maximum number of calendars per page", parseIntStrict)
    .option("--cursor <cursor>", "Pagination cursor from a previous response")
    .action(async (opts) => {
      const result = await luma.listOrgCalendars({
        paginationLimit: opts.limit,
        paginationCursor: opts.cursor,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  organization
    .command("list-events")
    .description("List events across all calendars in the organization")
    .option("--before <datetime>", "Filter events before this ISO 8601 datetime")
    .option("--after <datetime>", "Filter events after this ISO 8601 datetime")
    .option("--limit <number>", "Maximum number of events per page", parseIntStrict)
    .option("--cursor <cursor>", "Pagination cursor from a previous response")
    .option("--sort-direction <direction>", "Sort direction: asc, desc, asc nulls last, desc nulls last")
    .action(async (opts) => {
      const result = await luma.listOrgEvents({
        before: opts.before,
        after: opts.after,
        paginationLimit: opts.limit,
        paginationCursor: opts.cursor,
        sortDirection: opts.sortDirection,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  organization
    .command("transfer-event")
    .description("Transfer an event to a different calendar within the organization")
    .requiredOption("--event-id <id>", "Event ID (evt-xxx)")
    .requiredOption("--calendar-id <id>", "Destination calendar ID (cal-xxx)")
    .action(async (opts) => {
      await luma.transferEventCalendar({
        event_id: opts.eventId,
        calendar_id: opts.calendarId,
      });
      out.write(JSON.stringify({ transferred: true, event_id: opts.eventId, calendar_id: opts.calendarId }) + "\n");
    });

  organization
    .command("create-calendar")
    .description("Create a new calendar within the organization")
    .requiredOption("--name <name>", "Name of the calendar")
    .option("--slug <slug>", "URL slug (e.g. my-community becomes lu.ma/my-community)")
    .option("--description <description>", "Short description of the calendar")
    .option("--avatar-url <url>", "Avatar image URL (must be uploaded to Luma CDN first)")
    .option("--tint-color <color>", "Hex color (e.g. #E3CBEF)")
    .action(async (opts) => {
      const result = await luma.createCalendar({
        name: opts.name,
        slug: opts.slug,
        description: opts.description,
        avatar_url: opts.avatarUrl,
        tint_color: opts.tintColor,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  return organization;
}
