import { Command } from "commander";
import type { LumaService } from "../services/luma.js";
import type { Output } from "../output.js";
import { parseIntStrict } from "../parse.js";

export function createContactsCommand(luma: LumaService, out: Output): Command {
  const contacts = new Command("contacts")
    .description("Manage calendar contacts and contact tags. Use this to list, import, tag, and untag contacts.")
    .addHelpText("after", `\nSource: ${import.meta.dirname}`);

  contacts
    .command("list")
    .description("List contacts for the calendar")
    .option("--query <query>", "Search over names and emails")
    .option("--tags <tags>", "Comma-separated tag names or IDs to filter by (OR logic)")
    .option("--membership-status <status>", "Filter by membership status: approved, pending, approved-pending-payment, or declined")
    .option("--calendar-membership-tier-id <id>", "Filter by membership tier ID")
    .option("--sort-column <column>", "Sort by: created_at, event_checked_in_count, event_approved_count, name, or revenue_usd_cents")
    .option("--sort-direction <direction>", "Sort direction: asc, desc, asc nulls last, or desc nulls last")
    .option("--limit <number>", "Maximum number of contacts per page", parseIntStrict)
    .option("--cursor <cursor>", "Pagination cursor from a previous response")
    .action(async (opts) => {
      const tags = opts.tags ? opts.tags.split(",").map((s: string) => s.trim()) : undefined;
      const result = await luma.listContacts({
        query: opts.query,
        tags,
        membershipStatus: opts.membershipStatus,
        calendarMembershipTierId: opts.calendarMembershipTierId,
        sortColumn: opts.sortColumn,
        sortDirection: opts.sortDirection,
        paginationLimit: opts.limit,
        paginationCursor: opts.cursor,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  contacts
    .command("import")
    .description("Import contacts to the calendar by email")
    .requiredOption("--emails <emails>", "Comma-separated list of email addresses to import")
    .option("--names <names>", "Comma-separated list of names (matched by position to emails)")
    .option("--tags <tags>", "Comma-separated tag names or IDs to apply to imported contacts")
    .action(async (opts) => {
      const emails = opts.emails.split(",").map((s: string) => s.trim());
      const names = opts.names ? opts.names.split(",").map((s: string) => s.trim()) : [];
      const contactsList = emails.map((email: string, i: number) => ({
        email,
        ...(names[i] ? { name: names[i] } : {}),
      }));
      const tags = opts.tags ? opts.tags.split(",").map((s: string) => s.trim()) : undefined;
      await luma.importContacts({ contacts: contactsList, tags });
      out.write(JSON.stringify({ imported: true, count: contactsList.length }) + "\n");
    });

  contacts
    .command("list-contact-tags")
    .description("List all contact tags for the calendar")
    .action(async () => {
      const result = await luma.listContactTags();
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  contacts
    .command("create-contact-tag")
    .description("Create a new contact tag")
    .requiredOption("--name <name>", "Tag name")
    .option("--color <color>", "Tag color: cranberry, barney, red, green, blue, purple, yellow, or orange")
    .action(async (opts) => {
      const result = await luma.createContactTag({
        name: opts.name,
        color: opts.color,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  contacts
    .command("apply-contact-tag")
    .description("Apply a contact tag to one or more contacts")
    .requiredOption("--tag <tag>", "Tag ID or tag name")
    .option("--emails <emails>", "Comma-separated list of email addresses")
    .option("--user-ids <ids>", "Comma-separated list of user IDs")
    .action(async (opts) => {
      const emails = opts.emails ? opts.emails.split(",").map((s: string) => s.trim()) : undefined;
      const userIds = opts.userIds ? opts.userIds.split(",").map((s: string) => s.trim()) : undefined;
      const result = await luma.applyContactTag({
        tag: opts.tag,
        emails,
        user_ids: userIds,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  contacts
    .command("unapply-contact-tag")
    .description("Remove a contact tag from one or more contacts")
    .requiredOption("--tag <tag>", "Tag ID or tag name")
    .option("--emails <emails>", "Comma-separated list of email addresses")
    .option("--user-ids <ids>", "Comma-separated list of user IDs")
    .action(async (opts) => {
      const emails = opts.emails ? opts.emails.split(",").map((s: string) => s.trim()) : undefined;
      const userIds = opts.userIds ? opts.userIds.split(",").map((s: string) => s.trim()) : undefined;
      const result = await luma.unapplyContactTag({
        tag: opts.tag,
        emails,
        user_ids: userIds,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  contacts
    .command("update-contact-tag")
    .description("Update an existing contact tag")
    .requiredOption("--tag-id <id>", "Tag ID to update")
    .option("--name <name>", "New tag name")
    .option("--color <color>", "New tag color: cranberry, barney, red, green, blue, purple, yellow, or orange")
    .action(async (opts) => {
      await luma.updateContactTag({
        tag_id: opts.tagId,
        name: opts.name,
        color: opts.color,
      });
      out.write(JSON.stringify({ updated: true, tag_id: opts.tagId }) + "\n");
    });

  contacts
    .command("delete-contact-tag")
    .description("Delete a contact tag")
    .requiredOption("--tag-id <id>", "Tag ID to delete")
    .action(async (opts) => {
      await luma.deleteContactTag(opts.tagId);
      out.write(JSON.stringify({ deleted: true, tag_id: opts.tagId }) + "\n");
    });

  return contacts;
}
