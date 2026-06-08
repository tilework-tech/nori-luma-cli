import { describe, it, expect, beforeEach } from "vitest";
import { createMockLumaService, makeGuest, runCommand } from "../helpers.js";

describe("guests command", () => {
  let luma: ReturnType<typeof createMockLumaService>;

  beforeEach(() => {
    luma = createMockLumaService();
  });

  describe("guests list", () => {
    it("outputs empty entries array when no guests exist", async () => {
      const result = await runCommand(luma, [
        "guests",
        "list",
        "--event-id",
        "evt-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toEqual([]);
      expect(result.exitCode).toBe(0);
    });

    it("lists guests as JSON", async () => {
      const guest = makeGuest({
        id: "gst-1",
        user_email: "alice@example.com",
        user_name: "Alice",
      });
      luma.guests.set("evt-1", [guest]);

      const result = await runCommand(luma, [
        "guests",
        "list",
        "--event-id",
        "evt-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(output.entries[0].user_email).toBe("alice@example.com");
      expect(result.exitCode).toBe(0);
    });

    it("passes --status filter", async () => {
      luma.guests.set("evt-1", [
        makeGuest({ id: "gst-1", approval_status: "approved" }),
        makeGuest({ id: "gst-2", approval_status: "declined" }),
      ]);

      const result = await runCommand(luma, [
        "guests",
        "list",
        "--event-id",
        "evt-1",
        "--status",
        "approved",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(output.entries[0].approval_status).toBe("approved");
    });

    it("passes --limit for pagination", async () => {
      const guestList = Array.from({ length: 5 }, (_, i) =>
        makeGuest({ id: `gst-${i}`, user_email: `user${i}@example.com` })
      );
      luma.guests.set("evt-1", guestList);

      const result = await runCommand(luma, [
        "guests",
        "list",
        "--event-id",
        "evt-1",
        "--limit",
        "2",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.has_more).toBe(true);
      expect(output.next_cursor).toBeTruthy();
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, ["guests", "list"]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("guests get", () => {
    it("gets a guest by event-id and guest-id", async () => {
      luma.guests.set("evt-1", [
        makeGuest({ id: "gst-abc", user_name: "Bob" }),
      ]);

      const result = await runCommand(luma, [
        "guests",
        "get",
        "--event-id",
        "evt-1",
        "--id",
        "gst-abc",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.user_name).toBe("Bob");
      expect(output.id).toBe("gst-abc");
      expect(result.exitCode).toBe(0);
    });

    it("shows error when guest not found", async () => {
      const result = await runCommand(luma, [
        "guests",
        "get",
        "--event-id",
        "evt-1",
        "--id",
        "gst-missing",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "guests",
        "get",
        "--id",
        "gst-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --id flag", async () => {
      const result = await runCommand(luma, [
        "guests",
        "get",
        "--event-id",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("guests add", () => {
    it("adds guests with event-id and email", async () => {
      const result = await runCommand(luma, [
        "guests",
        "add",
        "--event-id",
        "evt-1",
        "--email",
        "alice@example.com",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.added).toBe(true);
      expect(result.exitCode).toBe(0);

      const guestList = luma.guests.get("evt-1")!;
      expect(guestList).toHaveLength(1);
      expect(guestList[0].user_email).toBe("alice@example.com");
    });

    it("supports multiple --email flags", async () => {
      const result = await runCommand(luma, [
        "guests",
        "add",
        "--event-id",
        "evt-1",
        "--email",
        "alice@example.com",
        "--email",
        "bob@example.com",
      ]);
      expect(result.exitCode).toBe(0);

      const guestList = luma.guests.get("evt-1")!;
      expect(guestList).toHaveLength(2);
    });

    it("passes --status option", async () => {
      const result = await runCommand(luma, [
        "guests",
        "add",
        "--event-id",
        "evt-1",
        "--email",
        "alice@example.com",
        "--status",
        "pending_approval",
      ]);
      expect(result.exitCode).toBe(0);

      const guestList = luma.guests.get("evt-1")!;
      expect(guestList[0].approval_status).toBe("pending_approval");
    });

    it("passes --suppress-notifications flag to service", async () => {
      const result = await runCommand(luma, [
        "guests",
        "add",
        "--event-id",
        "evt-1",
        "--email",
        "alice@example.com",
        "--suppress-notifications",
      ]);
      expect(result.exitCode).toBe(0);
      expect(luma.lastAddGuestsParams?.send_email).toBe(false);
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "guests",
        "add",
        "--email",
        "alice@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --email flag", async () => {
      const result = await runCommand(luma, [
        "guests",
        "add",
        "--event-id",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("guests update-status", () => {
    it("updates guest status by email", async () => {
      luma.guests.set("evt-1", [
        makeGuest({
          id: "gst-1",
          user_email: "alice@example.com",
          approval_status: "approved",
        }),
      ]);

      const result = await runCommand(luma, [
        "guests",
        "update-status",
        "--event-id",
        "evt-1",
        "--guest-email",
        "alice@example.com",
        "--status",
        "declined",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.updated).toBe(true);
      expect(result.exitCode).toBe(0);

      expect(luma.guests.get("evt-1")![0].approval_status).toBe("declined");
    });

    it("updates guest status by guest-id", async () => {
      luma.guests.set("evt-1", [
        makeGuest({ id: "gst-1", approval_status: "approved" }),
      ]);

      const result = await runCommand(luma, [
        "guests",
        "update-status",
        "--event-id",
        "evt-1",
        "--guest-id",
        "gst-1",
        "--status",
        "waitlist",
      ]);
      expect(result.exitCode).toBe(0);

      expect(luma.guests.get("evt-1")![0].approval_status).toBe("waitlist");
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "guests",
        "update-status",
        "--guest-email",
        "alice@example.com",
        "--status",
        "declined",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --status flag", async () => {
      const result = await runCommand(luma, [
        "guests",
        "update-status",
        "--event-id",
        "evt-1",
        "--guest-email",
        "alice@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires at least one of --guest-email or --guest-id", async () => {
      const result = await runCommand(luma, [
        "guests",
        "update-status",
        "--event-id",
        "evt-1",
        "--status",
        "declined",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when guest not found", async () => {
      const result = await runCommand(luma, [
        "guests",
        "update-status",
        "--event-id",
        "evt-1",
        "--guest-email",
        "nobody@example.com",
        "--status",
        "declined",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("guests send-invites", () => {
    it("sends invites to guests", async () => {
      const result = await runCommand(luma, [
        "guests",
        "send-invites",
        "--event-id",
        "evt-1",
        "--email",
        "alice@example.com",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.sent).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it("passes --message option to service", async () => {
      const result = await runCommand(luma, [
        "guests",
        "send-invites",
        "--event-id",
        "evt-1",
        "--email",
        "alice@example.com",
        "--message",
        "You are invited!",
      ]);
      expect(result.exitCode).toBe(0);
      expect(luma.lastSendInvitesParams?.message).toBe("You are invited!");
    });

    it("supports multiple --email flags", async () => {
      const result = await runCommand(luma, [
        "guests",
        "send-invites",
        "--event-id",
        "evt-1",
        "--email",
        "alice@example.com",
        "--email",
        "bob@example.com",
      ]);
      expect(result.exitCode).toBe(0);
      expect(luma.lastSendInvitesParams?.guests).toHaveLength(2);
      expect(luma.lastSendInvitesParams?.guests[0].email).toBe("alice@example.com");
      expect(luma.lastSendInvitesParams?.guests[1].email).toBe("bob@example.com");
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "guests",
        "send-invites",
        "--email",
        "alice@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --email flag", async () => {
      const result = await runCommand(luma, [
        "guests",
        "send-invites",
        "--event-id",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("guests --help", () => {
    it("shows guests subcommand help with available actions", async () => {
      const result = await runCommand(luma, ["guests", "--help"]);
      expect(result.stdout).toContain("list");
      expect(result.stdout).toContain("get");
      expect(result.stdout).toContain("add");
      expect(result.stdout).toContain("update-status");
      expect(result.stdout).toContain("send-invites");
    });
  });
});
