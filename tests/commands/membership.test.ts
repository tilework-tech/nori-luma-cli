import { describe, it, expect, beforeEach } from "vitest";
import { createMockLumaService, runCommand, makeMembershipTier } from "../helpers.js";

describe("membership command", () => {
  let luma: ReturnType<typeof createMockLumaService>;

  beforeEach(() => {
    luma = createMockLumaService();
  });

  it("shows help with subcommands", async () => {
    const result = await runCommand(luma, ["membership", "--help"]);
    expect(result.stdout).toContain("list-tiers");
    expect(result.stdout).toContain("add-member");
    expect(result.stdout).toContain("update-member-status");
  });

  describe("membership list-tiers", () => {
    it("returns paginated tier entries", async () => {
      luma.membershipTiers.push(
        makeMembershipTier({ id: "mst-1", name: "Free Tier" }),
        makeMembershipTier({ id: "mst-2", name: "Pro Tier" })
      );

      const result = await runCommand(luma, ["membership", "list-tiers"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.entries[0].name).toBe("Free Tier");
      expect(output.has_more).toBe(false);
    });

    it("supports pagination with --limit and --cursor", async () => {
      luma.membershipTiers.push(
        makeMembershipTier({ id: "mst-1", name: "Tier A" }),
        makeMembershipTier({ id: "mst-2", name: "Tier B" }),
        makeMembershipTier({ id: "mst-3", name: "Tier C" })
      );

      const result = await runCommand(luma, ["membership", "list-tiers", "--limit", "2"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.has_more).toBe(true);
      expect(output.next_cursor).toBeTruthy();

      const result2 = await runCommand(luma, ["membership", "list-tiers", "--limit", "2", "--cursor", output.next_cursor]);
      expect(result2.exitCode).toBe(0);
      const output2 = JSON.parse(result2.stdout);
      expect(output2.entries).toHaveLength(1);
      expect(output2.has_more).toBe(false);
    });

    it("returns empty entries when no tiers exist", async () => {
      const result = await runCommand(luma, ["membership", "list-tiers"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(0);
      expect(output.has_more).toBe(false);
    });
  });

  describe("membership add-member", () => {
    it("adds a member and returns membership_id and status", async () => {
      luma.membershipTiers.push(makeMembershipTier({ id: "mst-1" }));

      const result = await runCommand(luma, [
        "membership", "add-member",
        "--email", "alice@example.com",
        "--tier-id", "mst-1",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.membership_id).toBeTruthy();
      expect(output.status).toBe("approved");
    });

    it("succeeds with --skip-payment for paid tiers", async () => {
      luma.membershipTiers.push(
        makeMembershipTier({
          id: "mst-paid",
          access_info: { type: "payment-once", amount: 1000, currency: "usd", require_approval: false },
        })
      );

      const result = await runCommand(luma, [
        "membership", "add-member",
        "--email", "bob@example.com",
        "--tier-id", "mst-paid",
        "--skip-payment",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.membership_id).toBeTruthy();
      expect(output.status).toBe("approved");
    });

    it("requires --email", async () => {
      const result = await runCommand(luma, [
        "membership", "add-member",
        "--tier-id", "mst-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --tier-id", async () => {
      const result = await runCommand(luma, [
        "membership", "add-member",
        "--email", "alice@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("fails when tier does not exist", async () => {
      const result = await runCommand(luma, [
        "membership", "add-member",
        "--email", "alice@example.com",
        "--tier-id", "mst-nonexistent",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("membership update-member-status", () => {
    it("updates member status and outputs confirmation", async () => {
      luma.members.set("usr-123", { membership_id: "mem-1", status: "pending", tier_id: "mst-1", user_id: "usr-123" });

      const result = await runCommand(luma, [
        "membership", "update-member-status",
        "--user-id", "usr-123",
        "--status", "approved",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.updated).toBe(true);
      expect(output.user_id).toBe("usr-123");
      expect(output.status).toBe("approved");
    });

    it("accepts email as user identifier", async () => {
      luma.members.set("alice@example.com", { membership_id: "mem-2", status: "pending", tier_id: "mst-1", user_id: "alice@example.com" });

      const result = await runCommand(luma, [
        "membership", "update-member-status",
        "--user-id", "alice@example.com",
        "--status", "declined",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.updated).toBe(true);
      expect(output.user_id).toBe("alice@example.com");
      expect(output.status).toBe("declined");
    });

    it("requires --user-id", async () => {
      const result = await runCommand(luma, [
        "membership", "update-member-status",
        "--status", "approved",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --status", async () => {
      const result = await runCommand(luma, [
        "membership", "update-member-status",
        "--user-id", "usr-123",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("fails when member not found", async () => {
      const result = await runCommand(luma, [
        "membership", "update-member-status",
        "--user-id", "usr-nonexistent",
        "--status", "approved",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });
});
