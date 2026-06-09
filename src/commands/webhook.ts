import { Command } from "commander";
import type { LumaService } from "../services/luma.js";
import type { Output } from "../output.js";
import { parseIntStrict } from "../parse.js";

export function createWebhookCommand(luma: LumaService, out: Output): Command {
  const webhook = new Command("webhook")
    .description("Manage webhook endpoints for receiving event notifications. Use this to list, create, update, and delete webhooks.")
    .addHelpText("after", `\nSource: ${import.meta.dirname}`);

  webhook
    .command("list")
    .description("List all webhook endpoints")
    .option("--limit <number>", "Maximum number of webhooks per page", parseIntStrict)
    .option("--cursor <cursor>", "Pagination cursor from a previous response")
    .action(async (opts) => {
      const result = await luma.listWebhooks({
        paginationLimit: opts.limit,
        paginationCursor: opts.cursor,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  webhook
    .command("get")
    .description("Get details about a specific webhook endpoint")
    .requiredOption("--id <id>", "Webhook ID")
    .action(async (opts) => {
      const result = await luma.getWebhook(opts.id);
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  webhook
    .command("create")
    .description("Create a new webhook endpoint to receive event notifications")
    .requiredOption("--url <url>", "Webhook URL (must start with http)")
    .requiredOption("--event-types <types>", "Comma-separated event types (e.g. guest.registered,event.created)")
    .action(async (opts) => {
      const eventTypes = opts.eventTypes.split(",").map((s: string) => s.trim());
      const result = await luma.createWebhook({
        url: opts.url,
        event_types: eventTypes,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  webhook
    .command("update")
    .description("Update a webhook endpoint's event types or status")
    .requiredOption("--id <id>", "Webhook ID")
    .option("--event-types <types>", "Comma-separated event types")
    .option("--status <status>", "Webhook status: active or paused")
    .action(async (opts) => {
      const params: { id: string; event_types?: string[]; status?: string } = {
        id: opts.id,
      };
      if (opts.eventTypes) {
        params.event_types = opts.eventTypes.split(",").map((s: string) => s.trim());
      }
      if (opts.status) {
        params.status = opts.status;
      }
      const result = await luma.updateWebhook(params);
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  webhook
    .command("delete")
    .description("Delete a webhook endpoint")
    .requiredOption("--id <id>", "Webhook ID")
    .action(async (opts) => {
      await luma.deleteWebhook(opts.id);
      out.write(JSON.stringify({ deleted: true, id: opts.id }) + "\n");
    });

  return webhook;
}
