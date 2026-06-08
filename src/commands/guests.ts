import { Command } from "commander";
import type { LumaService } from "../services/luma.js";
import type { Output } from "../output.js";
import { parseIntStrict } from "../parse.js";

function collectEmails(value: string, previous: string[]): string[] {
  return previous.concat(value);
}

export function createGuestsCommand(luma: LumaService, out: Output): Command {
  const guests = new Command("guests")
    .description("Manage event guests. Use this to list, get, add, update status, or send invites to guests.")
    .addHelpText("after", `\nSource: ${import.meta.dirname}`);

  guests
    .command("list")
    .description("List guests for an event")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .option("--status <status>", "Filter by approval status: approved, pending_approval, invited, declined, waitlist")
    .option("--limit <number>", "Maximum number of guests per page", parseIntStrict)
    .option("--cursor <cursor>", "Pagination cursor from a previous response")
    .option("--sort-column <column>", "Sort by: name, email, created_at, registered_at, checked_in_at")
    .option("--sort-direction <direction>", "Sort direction: asc, desc")
    .action(async (opts) => {
      const result = await luma.listGuests({
        eventId: opts.eventId,
        approvalStatus: opts.status,
        paginationLimit: opts.limit,
        paginationCursor: opts.cursor,
        sortColumn: opts.sortColumn,
        sortDirection: opts.sortDirection,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  guests
    .command("get")
    .description("Get details for a specific guest")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .requiredOption("--id <guest-id>", "Guest identifier: guest ID (gst-xxx), ticket key, guest key (g-xxx), or email")
    .action(async (opts) => {
      const result = await luma.getGuest(opts.eventId, opts.id);
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  guests
    .command("add")
    .description("Add guests to an event")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .option("--email <email>", "Guest email (repeatable)", collectEmails, [])
    .option("--status <status>", "Approval status: approved (default), pending_approval, or waitlist")
    .option("--suppress-notifications", "Suppress notification emails")
    .action(async (opts) => {
      const emails: string[] = opts.email;
      if (emails.length === 0) {
        out.error("error: required option '--email <email>' not specified\n");
        out.setExitCode(1);
        return;
      }
      await luma.addGuests({
        event_id: opts.eventId,
        guests: emails.map((email: string) => ({ email })),
        approval_status: opts.status,
        send_email: opts.suppressNotifications ? false : undefined,
      });
      out.write(JSON.stringify({ added: true, event_id: opts.eventId }) + "\n");
    });

  guests
    .command("update-status")
    .description("Update a guest's approval status")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .option("--guest-email <email>", "Guest email (use this or --guest-id)")
    .option("--guest-id <id>", "Guest ID (use this or --guest-email)")
    .requiredOption("--status <status>", "New status: approved, declined, pending_approval, or waitlist")
    .option("--should-refund", "Refund paid guests when moving out of approved status")
    .option("--suppress-notifications", "Suppress status change notification")
    .action(async (opts) => {
      if (!opts.guestEmail && !opts.guestId) {
        out.error("error: must provide --guest-email or --guest-id\n");
        out.setExitCode(1);
        return;
      }
      const guest = opts.guestEmail
        ? { type: "email" as const, email: opts.guestEmail }
        : { type: "api_id" as const, api_id: opts.guestId };

      await luma.updateGuestStatus({
        event_id: opts.eventId,
        guest,
        status: opts.status,
        should_refund: opts.shouldRefund,
        send_email: opts.suppressNotifications ? false : undefined,
      });
      out.write(JSON.stringify({ updated: true, event_id: opts.eventId }) + "\n");
    });

  guests
    .command("send-invites")
    .description("Send event invitations to guests")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .option("--email <email>", "Guest email (repeatable)", collectEmails, [])
    .option("--message <message>", "Custom invite message (max 200 characters)")
    .action(async (opts) => {
      const emails: string[] = opts.email;
      if (emails.length === 0) {
        out.error("error: required option '--email <email>' not specified\n");
        out.setExitCode(1);
        return;
      }
      await luma.sendInvites({
        event_id: opts.eventId,
        guests: emails.map((email: string) => ({ email })),
        message: opts.message,
      });
      out.write(JSON.stringify({ sent: true, event_id: opts.eventId }) + "\n");
    });

  return guests;
}
