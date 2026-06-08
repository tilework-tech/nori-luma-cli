import { describe, it, expect, beforeEach } from "vitest";
import { createMockLumaService, makeEvent, runCommand } from "../helpers.js";

describe("events command", () => {
  let luma: ReturnType<typeof createMockLumaService>;

  beforeEach(() => {
    luma = createMockLumaService();
  });

  describe("events list", () => {
    it("outputs empty entries array as JSON when no events exist", async () => {
      const result = await runCommand(luma, ["events", "list"]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toEqual([]);
      expect(result.exitCode).toBe(0);
    });

    it("lists events as JSON", async () => {
      const event = makeEvent({ api_id: "evt-1", name: "My Event" });
      luma.events.set("evt-1", event);

      const result = await runCommand(luma, ["events", "list"]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(output.entries[0].event.name).toBe("My Event");
      expect(result.exitCode).toBe(0);
    });

    it("passes --after and --before filters", async () => {
      const early = makeEvent({
        api_id: "evt-early",
        name: "Early",
        start_at: "2024-01-01T00:00:00Z",
      });
      const late = makeEvent({
        api_id: "evt-late",
        name: "Late",
        start_at: "2024-12-01T00:00:00Z",
      });
      luma.events.set("evt-early", early);
      luma.events.set("evt-late", late);

      const result = await runCommand(luma, [
        "events",
        "list",
        "--after",
        "2024-06-01T00:00:00Z",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(output.entries[0].event.name).toBe("Late");
    });

    it("passes --limit for pagination", async () => {
      for (let i = 0; i < 5; i++) {
        const event = makeEvent({ api_id: `evt-${i}`, name: `Event ${i}` });
        luma.events.set(`evt-${i}`, event);
      }

      const result = await runCommand(luma, [
        "events",
        "list",
        "--limit",
        "2",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.has_more).toBe(true);
      expect(output.next_cursor).toBeTruthy();
    });

    it("passes --cursor for pagination", async () => {
      for (let i = 0; i < 5; i++) {
        const event = makeEvent({ api_id: `evt-${i}`, name: `Event ${i}` });
        luma.events.set(`evt-${i}`, event);
      }

      const result = await runCommand(luma, [
        "events",
        "list",
        "--limit",
        "2",
        "--cursor",
        "2",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
    });
  });

  describe("events get", () => {
    it("gets an event by ID and outputs JSON", async () => {
      const event = makeEvent({ api_id: "evt-abc", name: "My Event" });
      luma.events.set("evt-abc", event);

      const result = await runCommand(luma, ["events", "get", "--id", "evt-abc"]);
      const output = JSON.parse(result.stdout);
      expect(output.event.name).toBe("My Event");
      expect(output.event.api_id).toBe("evt-abc");
      expect(result.exitCode).toBe(0);
    });

    it("shows error when event not found", async () => {
      const result = await runCommand(luma, [
        "events",
        "get",
        "--id",
        "evt-nonexistent",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });

    it("requires --id flag", async () => {
      const result = await runCommand(luma, ["events", "get"]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("events create", () => {
    it("creates an event with required params and outputs JSON", async () => {
      const result = await runCommand(luma, [
        "events",
        "create",
        "--name",
        "New Event",
        "--start-at",
        "2024-07-01T18:00:00Z",
        "--timezone",
        "America/New_York",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.event.name).toBe("New Event");
      expect(result.exitCode).toBe(0);
    });

    it("creates an event with optional params", async () => {
      const result = await runCommand(luma, [
        "events",
        "create",
        "--name",
        "Full Event",
        "--start-at",
        "2024-07-01T18:00:00Z",
        "--timezone",
        "America/New_York",
        "--end-at",
        "2024-07-01T20:00:00Z",
        "--description",
        "A great event",
        "--meeting-url",
        "https://zoom.us/j/123",
        "--visibility",
        "public",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.event.name).toBe("Full Event");
      expect(result.exitCode).toBe(0);
    });

    it("requires --name flag", async () => {
      const result = await runCommand(luma, [
        "events",
        "create",
        "--start-at",
        "2024-07-01T18:00:00Z",
        "--timezone",
        "America/New_York",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --start-at flag", async () => {
      const result = await runCommand(luma, [
        "events",
        "create",
        "--name",
        "Test",
        "--timezone",
        "America/New_York",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --timezone flag", async () => {
      const result = await runCommand(luma, [
        "events",
        "create",
        "--name",
        "Test",
        "--start-at",
        "2024-07-01T18:00:00Z",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("events update", () => {
    it("updates an event name", async () => {
      const event = makeEvent({ api_id: "evt-up", name: "Original" });
      luma.events.set("evt-up", event);

      const result = await runCommand(luma, [
        "events",
        "update",
        "--event-id",
        "evt-up",
        "--name",
        "Updated",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.event.name).toBe("Updated");
      expect(result.exitCode).toBe(0);
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "events",
        "update",
        "--name",
        "New Name",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when event not found", async () => {
      const result = await runCommand(luma, [
        "events",
        "update",
        "--event-id",
        "evt-missing",
        "--name",
        "Nope",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("events cancel", () => {
    it("cancels an event with two-step flow", async () => {
      const event = makeEvent({ api_id: "evt-can", name: "To Cancel" });
      luma.events.set("evt-can", event);

      const result = await runCommand(luma, [
        "events",
        "cancel",
        "--event-id",
        "evt-can",
      ]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("evt-can");

      const getResult = await runCommand(luma, [
        "events",
        "get",
        "--id",
        "evt-can",
      ]);
      expect(getResult.exitCode).not.toBe(0);
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, ["events", "cancel"]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when event not found", async () => {
      const result = await runCommand(luma, [
        "events",
        "cancel",
        "--event-id",
        "evt-ghost",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("events --help", () => {
    it("shows events subcommand help with available actions", async () => {
      const result = await runCommand(luma, ["events", "--help"]);
      expect(result.stdout).toContain("list");
      expect(result.stdout).toContain("get");
      expect(result.stdout).toContain("create");
      expect(result.stdout).toContain("update");
      expect(result.stdout).toContain("cancel");
    });
  });
});
