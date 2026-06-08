import { Command } from "commander";
import type { LumaService } from "../services/luma.js";
import type { Output } from "../output.js";

export function createEventsCommand(luma: LumaService, out: Output): Command {
  const events = new Command("events")
    .description("Manage Luma events. Use this to list, get, create, update, or cancel events.")
    .addHelpText("after", `\nSource: ${import.meta.url}`);

  events
    .command("list")
    .description("List events managed by the calendar")
    .option("--after <datetime>", "Filter events after this ISO 8601 datetime")
    .option("--before <datetime>", "Filter events before this ISO 8601 datetime")
    .option("--limit <number>", "Maximum number of events per page", parseInt)
    .option("--cursor <cursor>", "Pagination cursor from a previous response")
    .action(async (opts) => {
      const result = await luma.listEvents({
        after: opts.after,
        before: opts.before,
        paginationLimit: opts.limit,
        paginationCursor: opts.cursor,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  events
    .command("get")
    .description("Get admin info for a specific event")
    .requiredOption("--id <event-id>", "Event ID (format: evt-xxx)")
    .action(async (opts) => {
      try {
        const result = await luma.getEvent(opts.id);
        out.write(JSON.stringify(result, null, 2) + "\n");
      } catch (err) {
        out.error(String(err) + "\n");
        out.setExitCode(1);
      }
    });

  events
    .command("create")
    .description("Create a new event")
    .requiredOption("--name <name>", "Event name")
    .requiredOption("--start-at <datetime>", "Start time in ISO 8601 format")
    .requiredOption("--timezone <tz>", "IANA timezone (e.g. America/New_York)")
    .option("--end-at <datetime>", "End time in ISO 8601 format")
    .option("--description <text>", "Event description in Markdown")
    .option("--cover-url <url>", "Cover image URL (must be hosted on Luma CDN)")
    .option("--meeting-url <url>", "Virtual meeting URL")
    .option("--max-capacity <number>", "Maximum guest capacity", parseInt)
    .option("--visibility <visibility>", "Event visibility: public, members-only, or private")
    .option("--slug <slug>", "URL slug (3-50 characters)")
    .action(async (opts) => {
      const result = await luma.createEvent({
        name: opts.name,
        start_at: opts.startAt,
        timezone: opts.timezone,
        end_at: opts.endAt,
        description_md: opts.description,
        cover_url: opts.coverUrl,
        meeting_url: opts.meetingUrl,
        max_capacity: opts.maxCapacity,
        visibility: opts.visibility,
        slug: opts.slug,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  events
    .command("update")
    .description("Update an existing event")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .option("--name <name>", "New event name")
    .option("--start-at <datetime>", "New start time in ISO 8601 format")
    .option("--timezone <tz>", "New IANA timezone")
    .option("--end-at <datetime>", "New end time in ISO 8601 format")
    .option("--description <text>", "New description in Markdown")
    .option("--cover-url <url>", "New cover image URL")
    .option("--meeting-url <url>", "New virtual meeting URL")
    .option("--max-capacity <number>", "New maximum capacity", parseInt)
    .option("--visibility <visibility>", "New visibility: public, members-only, or private")
    .option("--slug <slug>", "New URL slug")
    .option("--suppress-notifications", "Suppress guest notifications for this update")
    .action(async (opts) => {
      try {
        const result = await luma.updateEvent({
          event_id: opts.eventId,
          name: opts.name,
          start_at: opts.startAt,
          timezone: opts.timezone,
          end_at: opts.endAt,
          description_md: opts.description,
          cover_url: opts.coverUrl,
          meeting_url: opts.meetingUrl,
          max_capacity: opts.maxCapacity,
          visibility: opts.visibility,
          slug: opts.slug,
          suppress_notifications: opts.suppressNotifications,
        });
        out.write(JSON.stringify(result, null, 2) + "\n");
      } catch (err) {
        out.error(String(err) + "\n");
        out.setExitCode(1);
      }
    });

  events
    .command("cancel")
    .description("Cancel an event (irreversible). Performs two-step cancellation flow.")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .action(async (opts) => {
      try {
        const { cancellation_token } = await luma.requestCancellation(opts.eventId);
        await luma.cancelEvent(opts.eventId, cancellation_token);
        out.write(JSON.stringify({ cancelled: true, event_id: opts.eventId }) + "\n");
      } catch (err) {
        out.error(String(err) + "\n");
        out.setExitCode(1);
      }
    });

  return events;
}
