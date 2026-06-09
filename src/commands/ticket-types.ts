import { Command } from "commander";
import type { LumaService } from "../services/luma.js";
import type { Output } from "../output.js";
import { parseIntStrict } from "../parse.js";

export function createTicketTypesCommand(luma: LumaService, out: Output): Command {
  const ticketTypes = new Command("ticket-types")
    .description("Manage event ticket types. Use this to list, get, create, update, or delete ticket types.")

  ticketTypes
    .command("list")
    .description("List ticket types for an event")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .option("--include-hidden", "Include hidden ticket types")
    .action(async (opts) => {
      const result = await luma.listTicketTypes({
        eventId: opts.eventId,
        includeHidden: opts.includeHidden,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  ticketTypes
    .command("get")
    .description("Get details for a specific ticket type")
    .requiredOption("--ticket-type-id <id>", "Ticket type ID (format: ett-xxx)")
    .action(async (opts) => {
      const result = await luma.getTicketType(opts.ticketTypeId);
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  ticketTypes
    .command("create")
    .description("Create a new ticket type for an event")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .requiredOption("--name <name>", "Ticket type name")
    .requiredOption("--type <type>", "Ticket type: free or paid")
    .option("--description <text>", "Ticket description")
    .option("--require-approval", "Require host approval for registration")
    .option("--no-require-approval", "Do not require host approval")
    .option("--hidden", "Hide ticket type (requires access/coupon code)")
    .option("--no-hidden", "Show ticket type publicly")
    .option("--valid-start-at <date>", "Sales start date (ISO 8601, e.g. 2025-09-01)")
    .option("--valid-end-at <date>", "Sales end date (ISO 8601, e.g. 2025-09-01)")
    .option("--max-capacity <number>", "Maximum tickets available", parseIntStrict)
    .option("--cents <number>", "Price in cents (for paid tickets)", parseIntStrict)
    .option("--currency <code>", "Currency code (e.g. usd)")
    .option("--flexible", "Enable pay-what-you-wish pricing")
    .option("--no-flexible", "Disable pay-what-you-wish pricing")
    .option("--min-cents <number>", "Minimum price in cents (for flexible pricing)", parseIntStrict)
    .action(async (opts) => {
      const result = await luma.createTicketType({
        event_id: opts.eventId,
        name: opts.name,
        type: opts.type,
        description: opts.description,
        require_approval: opts.requireApproval !== undefined ? opts.requireApproval : undefined,
        is_hidden: opts.hidden !== undefined ? opts.hidden : undefined,
        valid_start_at: opts.validStartAt,
        valid_end_at: opts.validEndAt,
        max_capacity: opts.maxCapacity,
        cents: opts.cents,
        currency: opts.currency,
        is_flexible: opts.flexible !== undefined ? opts.flexible : undefined,
        min_cents: opts.minCents,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  ticketTypes
    .command("update")
    .description("Update an existing ticket type")
    .requiredOption("--ticket-type-id <id>", "Ticket type ID (format: ett-xxx)")
    .option("--name <name>", "Ticket type name")
    .option("--type <type>", "Ticket type: free or paid")
    .option("--description <text>", "Ticket description")
    .option("--require-approval", "Require host approval for registration")
    .option("--no-require-approval", "Do not require host approval")
    .option("--hidden", "Hide ticket type")
    .option("--no-hidden", "Show ticket type publicly")
    .option("--valid-start-at <date>", "Sales start date (ISO 8601)")
    .option("--valid-end-at <date>", "Sales end date (ISO 8601)")
    .option("--max-capacity <number>", "Maximum tickets available", parseIntStrict)
    .option("--cents <number>", "Price in cents", parseIntStrict)
    .option("--currency <code>", "Currency code (e.g. usd)")
    .option("--flexible", "Enable pay-what-you-wish pricing")
    .option("--no-flexible", "Disable pay-what-you-wish pricing")
    .option("--min-cents <number>", "Minimum price in cents", parseIntStrict)
    .action(async (opts) => {
      const result = await luma.updateTicketType({
        event_ticket_type_id: opts.ticketTypeId,
        name: opts.name,
        type: opts.type,
        description: opts.description,
        require_approval: opts.requireApproval !== undefined ? opts.requireApproval : undefined,
        is_hidden: opts.hidden !== undefined ? opts.hidden : undefined,
        valid_start_at: opts.validStartAt,
        valid_end_at: opts.validEndAt,
        max_capacity: opts.maxCapacity,
        cents: opts.cents,
        currency: opts.currency,
        is_flexible: opts.flexible !== undefined ? opts.flexible : undefined,
        min_cents: opts.minCents,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  ticketTypes
    .command("delete")
    .description("Delete a ticket type (cannot delete if tickets sold or last visible type)")
    .requiredOption("--ticket-type-id <id>", "Ticket type ID (format: ett-xxx)")
    .action(async (opts) => {
      await luma.deleteTicketType({
        event_ticket_type_id: opts.ticketTypeId,
      });
      out.write(JSON.stringify({ deleted: true, event_ticket_type_id: opts.ticketTypeId }) + "\n");
    });

  return ticketTypes;
}
