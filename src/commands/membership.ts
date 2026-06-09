import { Command } from "commander";
import type { LumaService } from "../services/luma.js";
import type { Output } from "../output.js";
import { parseIntStrict } from "../parse.js";

export function createMembershipCommand(luma: LumaService, out: Output): Command {
  const membership = new Command("membership")
    .description("Manage membership tiers and members. Use this to list tiers, add members, and update member status.")

  membership
    .command("list-tiers")
    .description("List membership tiers for the calendar")
    .option("--limit <number>", "Maximum number of tiers per page", parseIntStrict)
    .option("--cursor <cursor>", "Pagination cursor from a previous response")
    .action(async (opts) => {
      const result = await luma.listMembershipTiers({
        paginationLimit: opts.limit,
        paginationCursor: opts.cursor,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  membership
    .command("add-member")
    .description("Add a member to a membership tier")
    .requiredOption("--email <email>", "Email address of the member to add")
    .requiredOption("--tier-id <id>", "Membership tier ID")
    .option("--skip-payment", "Skip payment for paid tiers (when handling payment externally)")
    .action(async (opts) => {
      const result = await luma.addMember({
        email: opts.email,
        membership_tier_id: opts.tierId,
        skip_payment: opts.skipPayment,
      });
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  membership
    .command("update-member-status")
    .description("Update a member's membership status")
    .requiredOption("--user-id <id>", "User ID (usr-xxx) or email address")
    .requiredOption("--status <status>", "New status: approved or declined")
    .action(async (opts) => {
      await luma.updateMemberStatus({
        user_id: opts.userId,
        status: opts.status,
      });
      out.write(JSON.stringify({ updated: true, user_id: opts.userId, status: opts.status }) + "\n");
    });

  return membership;
}
