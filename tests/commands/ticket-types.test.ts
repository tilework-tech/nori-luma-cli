import { describe, it, expect, beforeEach } from "vitest";
import { createMockLumaService, makeTicketType, runCommand } from "../helpers.js";

describe("ticket-types command", () => {
  let luma: ReturnType<typeof createMockLumaService>;

  beforeEach(() => {
    luma = createMockLumaService();
  });

  describe("ticket-types list", () => {
    it("lists ticket types for an event", async () => {
      const tt = makeTicketType({ id: "ett-1", name: "VIP" });
      luma.ticketTypes.set("evt-1", [tt]);

      const result = await runCommand(luma, [
        "ticket-types",
        "list",
        "--event-id",
        "evt-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(output.entries[0].name).toBe("VIP");
      expect(result.exitCode).toBe(0);
    });

    it("passes --include-hidden option", async () => {
      const visible = makeTicketType({ id: "ett-1", name: "General", is_hidden: false });
      const hidden = makeTicketType({ id: "ett-2", name: "Secret", is_hidden: true });
      luma.ticketTypes.set("evt-1", [visible, hidden]);

      const result = await runCommand(luma, [
        "ticket-types",
        "list",
        "--event-id",
        "evt-1",
        "--include-hidden",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(result.exitCode).toBe(0);
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, ["ticket-types", "list"]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("ticket-types get", () => {
    it("gets a ticket type by id", async () => {
      const tt = makeTicketType({ id: "ett-1", name: "Early Bird" });
      luma.ticketTypes.set("evt-1", [tt]);

      const result = await runCommand(luma, [
        "ticket-types",
        "get",
        "--ticket-type-id",
        "ett-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.name).toBe("Early Bird");
      expect(result.exitCode).toBe(0);
    });

    it("requires --ticket-type-id flag", async () => {
      const result = await runCommand(luma, ["ticket-types", "get"]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when ticket type not found", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "get",
        "--ticket-type-id",
        "ett-nonexistent",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("ticket-types create", () => {
    it("creates a ticket type with required fields", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "create",
        "--event-id",
        "evt-1",
        "--name",
        "General Admission",
        "--type",
        "free",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.name).toBe("General Admission");
      expect(output.type).toBe("free");
      expect(output.id).toBeDefined();
      expect(result.exitCode).toBe(0);

      expect(luma.ticketTypes.get("evt-1")).toHaveLength(1);
    });

    it("passes optional fields for paid ticket", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "create",
        "--event-id",
        "evt-1",
        "--name",
        "Premium",
        "--type",
        "paid",
        "--cents",
        "5000",
        "--currency",
        "usd",
        "--description",
        "Premium seating",
        "--max-capacity",
        "100",
        "--require-approval",
        "--hidden",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.name).toBe("Premium");
      expect(output.type).toBe("paid");
      expect(output.cents).toBe(5000);
      expect(output.currency).toBe("usd");
      expect(output.description).toBe("Premium seating");
      expect(output.max_capacity).toBe(100);
      expect(output.require_approval).toBe(true);
      expect(output.is_hidden).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it("passes flexible pricing options", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "create",
        "--event-id",
        "evt-1",
        "--name",
        "Donation",
        "--type",
        "paid",
        "--flexible",
        "--min-cents",
        "1000",
        "--cents",
        "5000",
        "--currency",
        "usd",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.is_flexible).toBe(true);
      expect(output.min_cents).toBe(1000);
      expect(result.exitCode).toBe(0);
    });

    it("passes --valid-start-at and --valid-end-at options", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "create",
        "--event-id",
        "evt-1",
        "--name",
        "Early Bird",
        "--type",
        "free",
        "--valid-start-at",
        "2025-01-01",
        "--valid-end-at",
        "2025-06-01",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.valid_start_at).toBe("2025-01-01");
      expect(output.valid_end_at).toBe("2025-06-01");
      expect(result.exitCode).toBe(0);
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "create",
        "--name",
        "Test",
        "--type",
        "free",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --name flag", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "create",
        "--event-id",
        "evt-1",
        "--type",
        "free",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --type flag", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "create",
        "--event-id",
        "evt-1",
        "--name",
        "Test",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("ticket-types update", () => {
    it("updates a ticket type name", async () => {
      const tt = makeTicketType({ id: "ett-1", name: "Old Name" });
      luma.ticketTypes.set("evt-1", [tt]);

      const result = await runCommand(luma, [
        "ticket-types",
        "update",
        "--ticket-type-id",
        "ett-1",
        "--name",
        "New Name",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.name).toBe("New Name");
      expect(result.exitCode).toBe(0);
    });

    it("passes optional pricing fields", async () => {
      const tt = makeTicketType({ id: "ett-1", type: "free" });
      luma.ticketTypes.set("evt-1", [tt]);

      const result = await runCommand(luma, [
        "ticket-types",
        "update",
        "--ticket-type-id",
        "ett-1",
        "--type",
        "paid",
        "--cents",
        "2500",
        "--currency",
        "usd",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.type).toBe("paid");
      expect(output.cents).toBe(2500);
      expect(output.currency).toBe("usd");
      expect(result.exitCode).toBe(0);
    });

    it("requires --ticket-type-id flag", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "update",
        "--name",
        "Test",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when ticket type not found", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "update",
        "--ticket-type-id",
        "ett-nonexistent",
        "--name",
        "Test",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("ticket-types delete", () => {
    it("deletes a ticket type", async () => {
      const tt = makeTicketType({ id: "ett-1" });
      luma.ticketTypes.set("evt-1", [tt]);

      const result = await runCommand(luma, [
        "ticket-types",
        "delete",
        "--ticket-type-id",
        "ett-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.deleted).toBe(true);
      expect(result.exitCode).toBe(0);

      expect(luma.ticketTypes.get("evt-1")).toHaveLength(0);
    });

    it("requires --ticket-type-id flag", async () => {
      const result = await runCommand(luma, ["ticket-types", "delete"]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when ticket type not found", async () => {
      const result = await runCommand(luma, [
        "ticket-types",
        "delete",
        "--ticket-type-id",
        "ett-nonexistent",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("ticket-types --help", () => {
    it("shows ticket-types subcommand help with available actions", async () => {
      const result = await runCommand(luma, ["ticket-types", "--help"]);
      expect(result.stdout).toContain("list");
      expect(result.stdout).toContain("get");
      expect(result.stdout).toContain("create");
      expect(result.stdout).toContain("update");
      expect(result.stdout).toContain("delete");
    });
  });
});
