import { describe, it, expect, beforeEach } from "vitest";
import { createMockLumaService, runCommand, makeWebhook } from "../helpers.js";

describe("webhook command", () => {
  let luma: ReturnType<typeof createMockLumaService>;

  beforeEach(() => {
    luma = createMockLumaService();
  });

  it("shows help with subcommands", async () => {
    const result = await runCommand(luma, ["webhook", "--help"]);
    expect(result.stdout).toContain("list");
    expect(result.stdout).toContain("get");
    expect(result.stdout).toContain("create");
    expect(result.stdout).toContain("update");
    expect(result.stdout).toContain("delete");
  });

  describe("webhook list", () => {
    it("returns paginated webhook entries", async () => {
      luma.webhooks.push(
        makeWebhook({ id: "wh-1", url: "https://example.com/hook1" }),
        makeWebhook({ id: "wh-2", url: "https://example.com/hook2" })
      );

      const result = await runCommand(luma, ["webhook", "list"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.entries[0].url).toBe("https://example.com/hook1");
      expect(output.has_more).toBe(false);
    });

    it("supports pagination with --limit and --cursor", async () => {
      luma.webhooks.push(
        makeWebhook({ id: "wh-1" }),
        makeWebhook({ id: "wh-2" }),
        makeWebhook({ id: "wh-3" })
      );

      const result = await runCommand(luma, ["webhook", "list", "--limit", "2"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.has_more).toBe(true);
      expect(output.next_cursor).toBeTruthy();

      const result2 = await runCommand(luma, ["webhook", "list", "--limit", "2", "--cursor", output.next_cursor]);
      expect(result2.exitCode).toBe(0);
      const output2 = JSON.parse(result2.stdout);
      expect(output2.entries).toHaveLength(1);
      expect(output2.has_more).toBe(false);
    });

    it("returns empty entries when no webhooks exist", async () => {
      const result = await runCommand(luma, ["webhook", "list"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(0);
      expect(output.has_more).toBe(false);
    });
  });

  describe("webhook get", () => {
    it("returns a single webhook", async () => {
      luma.webhooks.push(
        makeWebhook({ id: "wh-1", url: "https://example.com/hook", event_types: ["guest.registered"], status: "active", secret: "whsec_abc" })
      );

      const result = await runCommand(luma, ["webhook", "get", "--id", "wh-1"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.id).toBe("wh-1");
      expect(output.url).toBe("https://example.com/hook");
      expect(output.event_types).toContain("guest.registered");
      expect(output.secret).toBe("whsec_abc");
    });

    it("requires --id", async () => {
      const result = await runCommand(luma, ["webhook", "get"]);
      expect(result.exitCode).not.toBe(0);
    });

    it("fails when webhook not found", async () => {
      const result = await runCommand(luma, ["webhook", "get", "--id", "wh-nonexistent"]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("webhook create", () => {
    it("creates a webhook and outputs the result", async () => {
      const result = await runCommand(luma, [
        "webhook", "create",
        "--url", "https://example.com/hook",
        "--event-types", "guest.registered",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.url).toBe("https://example.com/hook");
      expect(output.event_types).toContain("guest.registered");
      expect(output.id).toBeTruthy();
      expect(output.secret).toBeTruthy();
      expect(output.status).toBe("active");
    });

    it("supports multiple comma-separated event types", async () => {
      const result = await runCommand(luma, [
        "webhook", "create",
        "--url", "https://example.com/hook",
        "--event-types", "guest.registered,event.created,event.updated",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.event_types).toHaveLength(3);
      expect(output.event_types).toContain("guest.registered");
      expect(output.event_types).toContain("event.created");
      expect(output.event_types).toContain("event.updated");
    });

    it("requires --url", async () => {
      const result = await runCommand(luma, [
        "webhook", "create",
        "--event-types", "guest.registered",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --event-types", async () => {
      const result = await runCommand(luma, [
        "webhook", "create",
        "--url", "https://example.com/hook",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("webhook update", () => {
    it("updates webhook status", async () => {
      luma.webhooks.push(makeWebhook({ id: "wh-1", status: "active" }));

      const result = await runCommand(luma, [
        "webhook", "update",
        "--id", "wh-1",
        "--status", "paused",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.status).toBe("paused");
    });

    it("updates webhook event types", async () => {
      luma.webhooks.push(makeWebhook({ id: "wh-1", event_types: ["guest.registered"] }));

      const result = await runCommand(luma, [
        "webhook", "update",
        "--id", "wh-1",
        "--event-types", "event.created,event.updated",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.event_types).toContain("event.created");
      expect(output.event_types).toContain("event.updated");
    });

    it("succeeds with no optional flags and returns unchanged webhook", async () => {
      luma.webhooks.push(makeWebhook({ id: "wh-1", status: "active", event_types: ["guest.registered"] }));

      const result = await runCommand(luma, [
        "webhook", "update",
        "--id", "wh-1",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.status).toBe("active");
      expect(output.event_types).toContain("guest.registered");
    });

    it("requires --id", async () => {
      const result = await runCommand(luma, [
        "webhook", "update",
        "--status", "paused",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("fails when webhook not found", async () => {
      const result = await runCommand(luma, [
        "webhook", "update",
        "--id", "wh-nonexistent",
        "--status", "active",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("webhook delete", () => {
    it("deletes a webhook and outputs confirmation", async () => {
      luma.webhooks.push(makeWebhook({ id: "wh-1" }));

      const result = await runCommand(luma, ["webhook", "delete", "--id", "wh-1"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.deleted).toBe(true);
      expect(output.id).toBe("wh-1");
    });

    it("requires --id", async () => {
      const result = await runCommand(luma, ["webhook", "delete"]);
      expect(result.exitCode).not.toBe(0);
    });

    it("fails when webhook not found", async () => {
      const result = await runCommand(luma, ["webhook", "delete", "--id", "wh-nonexistent"]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });
});
