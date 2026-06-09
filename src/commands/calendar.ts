import { Command } from "commander";
import type { LumaService } from "../services/luma.js";
import type { Output } from "../output.js";
import { parseIntStrict } from "../parse.js";

export function createCalendarCommand(luma: LumaService, out: Output): Command {
  const calendar = new Command("calendar")
    .description("Manage calendar settings, admins, coupons, event tags, and event submissions.")
    .addHelpText("after", `\nSource: ${import.meta.dirname}`);

  calendar
    .command("get")
    .description("Get calendar details for the authenticated API key")
    .action(async () => {
      const result = await luma.getCalendar();
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  calendar
    .command("lookup-event")
    .description("Check if an event exists on the calendar")
    .option("--event-id <id>", "Event ID (format: evt-xxx)")
    .option("--platform <platform>", "Platform filter: luma or external")
    .option("--url <url>", "Event URL for lookup")
    .action(async (opts) => {
      const result = await luma.lookupEvent({
        event_id: opts.eventId,
        platform: opts.platform,
        url: opts.url,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  calendar
    .command("add-event")
    .description("Add or submit an event to the calendar")
    .requiredOption("--platform <platform>", "Platform: luma or external")
    .option("--event-id <id>", "Event ID for luma platform (format: evt-xxx)")
    .option("--url <url>", "Event URL for external platform")
    .option("--name <name>", "Event name for external platform")
    .option("--start-at <datetime>", "Start time in ISO 8601 format (external)")
    .option("--duration-interval <interval>", "Duration interval (external, e.g. PT2H)")
    .option("--timezone <tz>", "IANA timezone (external, e.g. America/New_York)")
    .option("--submission-mode <mode>", "Submission mode: auto or pending")
    .option("--host <host>", "Host name for external platform")
    .action(async (opts, cmd) => {
      if (opts.platform === "luma") {
        if (!opts.eventId) {
          out.error("error: required option '--event-id <id>' not specified for luma platform\n");
          cmd.help({ error: true });
          return;
        }
        const result = await luma.addEventToCalendar({
          platform: "luma",
          event_id: opts.eventId,
          submission_mode: opts.submissionMode,
        });
        out.write(JSON.stringify(result, null, 2) + "\n");
      } else {
        const missing = ["url", "name", "startAt", "durationInterval", "timezone"]
          .filter((k) => !opts[k])
          .map((k) => "--" + k.replace(/[A-Z]/g, (c: string) => "-" + c.toLowerCase()));
        if (missing.length > 0) {
          out.error(`error: required options ${missing.join(", ")} not specified for external platform\n`);
          cmd.help({ error: true });
          return;
        }
        const result = await luma.addEventToCalendar({
          platform: "external",
          url: opts.url,
          name: opts.name,
          start_at: opts.startAt,
          duration_interval: opts.durationInterval,
          timezone: opts.timezone,
          submission_mode: opts.submissionMode,
          host: opts.host,
        });
        out.write(JSON.stringify(result, null, 2) + "\n");
      }
    });

  calendar
    .command("approve-event")
    .description("Approve a pending event submission on the calendar")
    .requiredOption("--calendar-event-id <id>", "Calendar event ID (format: calev-xxx or evt-xxx)")
    .action(async (opts) => {
      await luma.approveEvent(opts.calendarEventId);
      out.write(JSON.stringify({ approved: true, calendar_event_id: opts.calendarEventId }) + "\n");
    });

  calendar
    .command("reject-event")
    .description("Reject a pending event submission on the calendar")
    .requiredOption("--calendar-event-id <id>", "Calendar event ID (format: calev-xxx or evt-xxx)")
    .option("--message <message>", "Optional rejection message to the submitter")
    .action(async (opts) => {
      await luma.rejectEvent({
        calendar_event_id: opts.calendarEventId,
        message: opts.message,
      });
      out.write(JSON.stringify({ rejected: true, calendar_event_id: opts.calendarEventId }) + "\n");
    });

  calendar
    .command("list-admins")
    .description("List all admins for the calendar")
    .action(async () => {
      const result = await luma.listAdmins();
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  calendar
    .command("list-coupons")
    .description("List all coupons for the calendar")
    .option("--limit <number>", "Maximum number of coupons per page", parseIntStrict)
    .option("--cursor <cursor>", "Pagination cursor from a previous response")
    .action(async (opts) => {
      const result = await luma.listCoupons({
        paginationLimit: opts.limit,
        paginationCursor: opts.cursor,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  calendar
    .command("create-coupon")
    .description("Create a new coupon for the calendar")
    .requiredOption("--code <code>", "Coupon code (1-20 characters, case insensitive)")
    .requiredOption("--discount-type <type>", "Discount type: percent or amount")
    .option("--percent-off <number>", "Percent discount (0-100, for percent type)", parseIntStrict)
    .option("--cents-off <number>", "Amount discount in cents (for amount type)", parseIntStrict)
    .option("--currency <code>", "Currency code for amount discount (e.g. usd)")
    .option("--remaining-count <number>", "Number of uses (use 1000000 for unlimited)", parseIntStrict)
    .option("--valid-start-at <date>", "Coupon valid from (ISO 8601)")
    .option("--valid-end-at <date>", "Coupon valid until (ISO 8601)")
    .action(async (opts) => {
      let discount;
      if (opts.discountType === "percent") {
        discount = { discount_type: "percent" as const, percent_off: opts.percentOff };
      } else {
        discount = { discount_type: "amount" as const, cents_off: opts.centsOff, currency: opts.currency };
      }
      const result = await luma.createCoupon({
        code: opts.code,
        discount,
        remaining_count: opts.remainingCount,
        valid_start_at: opts.validStartAt,
        valid_end_at: opts.validEndAt,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  calendar
    .command("update-coupon")
    .description("Update an existing calendar coupon (identified by code)")
    .requiredOption("--code <code>", "Coupon code to update")
    .option("--remaining-count <number>", "New remaining use count", parseIntStrict)
    .option("--valid-start-at <date>", "New valid-from date (ISO 8601)")
    .option("--valid-end-at <date>", "New valid-until date (ISO 8601)")
    .action(async (opts) => {
      await luma.updateCoupon({
        code: opts.code,
        remaining_count: opts.remainingCount,
        valid_start_at: opts.validStartAt,
        valid_end_at: opts.validEndAt,
      });
      out.write(JSON.stringify({ updated: true, code: opts.code }) + "\n");
    });

  calendar
    .command("list-event-tags")
    .description("List all event tags for the calendar")
    .action(async () => {
      const result = await luma.listEventTags();
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  calendar
    .command("create-event-tag")
    .description("Create a new event tag for the calendar")
    .requiredOption("--name <name>", "Tag name")
    .option("--color <color>", "Tag color: cranberry, barney, red, green, blue, purple, yellow, or orange")
    .action(async (opts) => {
      const result = await luma.createEventTag({
        name: opts.name,
        color: opts.color,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  calendar
    .command("update-event-tag")
    .description("Update an existing event tag")
    .requiredOption("--tag-id <id>", "Tag ID to update")
    .option("--name <name>", "New tag name")
    .option("--color <color>", "New tag color: cranberry, barney, red, green, blue, purple, yellow, or orange")
    .action(async (opts) => {
      await luma.updateEventTag({
        tag_id: opts.tagId,
        name: opts.name,
        color: opts.color,
      });
      out.write(JSON.stringify({ updated: true, tag_id: opts.tagId }) + "\n");
    });

  calendar
    .command("delete-event-tag")
    .description("Delete an event tag from the calendar")
    .requiredOption("--tag-id <id>", "Tag ID to delete")
    .action(async (opts) => {
      await luma.deleteEventTag(opts.tagId);
      out.write(JSON.stringify({ deleted: true, tag_id: opts.tagId }) + "\n");
    });

  calendar
    .command("apply-event-tag")
    .description("Apply an event tag to one or more events")
    .requiredOption("--tag <tag>", "Tag ID or tag name")
    .option("--event-ids <ids>", "Comma-separated list of event IDs")
    .action(async (opts) => {
      const eventIds = opts.eventIds ? opts.eventIds.split(",").map((s: string) => s.trim()) : undefined;
      const result = await luma.applyEventTag({
        tag: opts.tag,
        event_ids: eventIds,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  calendar
    .command("unapply-event-tag")
    .description("Remove an event tag from one or more events")
    .requiredOption("--tag <tag>", "Tag ID or tag name")
    .option("--event-ids <ids>", "Comma-separated list of event IDs")
    .action(async (opts) => {
      const eventIds = opts.eventIds ? opts.eventIds.split(",").map((s: string) => s.trim()) : undefined;
      const result = await luma.unapplyEventTag({
        tag: opts.tag,
        event_ids: eventIds,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  return calendar;
}
