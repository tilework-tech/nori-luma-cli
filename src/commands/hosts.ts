import { Command } from "commander";
import type { LumaService } from "../services/luma.js";
import type { Output } from "../output.js";

export function createHostsCommand(luma: LumaService, out: Output): Command {
  const hosts = new Command("hosts")
    .description("Manage event hosts. Use this to add, update, or remove hosts from events.")

  hosts
    .command("add")
    .description("Add a host to an event")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .requiredOption("--email <email>", "Host email address")
    .option("--access-level <level>", "Access level: none, check-in, or manager (default)")
    .option("--name <name>", "Host display name (ignored if email has existing Luma profile)")
    .option("--visible", "Show host on event page (default)")
    .option("--no-visible", "Hide host from event page")
    .action(async (opts) => {
      await luma.createHost({
        event_id: opts.eventId,
        email: opts.email,
        access_level: opts.accessLevel,
        is_visible: opts.visible !== undefined ? opts.visible : undefined,
        name: opts.name,
      });
      out.write(JSON.stringify({ added: true, event_id: opts.eventId }) + "\n");
    });

  hosts
    .command("update")
    .description("Update a host's access level or visibility")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .requiredOption("--email <email>", "Host email address")
    .option("--access-level <level>", "New access level: none, check-in, or manager")
    .option("--visible", "Show host on event page")
    .option("--no-visible", "Hide host from event page")
    .action(async (opts) => {
      await luma.updateHost({
        event_id: opts.eventId,
        email: opts.email,
        access_level: opts.accessLevel,
        is_visible: opts.visible !== undefined ? opts.visible : undefined,
      });
      out.write(JSON.stringify({ updated: true, event_id: opts.eventId }) + "\n");
    });

  hosts
    .command("remove")
    .description("Remove a host from an event (event creator cannot be removed)")
    .requiredOption("--event-id <event-id>", "Event ID (format: evt-xxx)")
    .requiredOption("--email <email>", "Host email address")
    .action(async (opts) => {
      await luma.removeHost({
        event_id: opts.eventId,
        email: opts.email,
      });
      out.write(JSON.stringify({ removed: true, event_id: opts.eventId }) + "\n");
    });

  return hosts;
}
