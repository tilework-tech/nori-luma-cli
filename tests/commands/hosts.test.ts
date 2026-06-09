import { describe, it, expect, beforeEach } from "vitest";
import { createMockLumaService, runCommand } from "../helpers.js";

describe("hosts command", () => {
  let luma: ReturnType<typeof createMockLumaService>;

  beforeEach(() => {
    luma = createMockLumaService();
  });

  describe("hosts add", () => {
    it("adds a host with event-id and email", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "add",
        "--event-id",
        "evt-1",
        "--email",
        "host@example.com",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.added).toBe(true);
      expect(result.exitCode).toBe(0);

      const hostList = luma.hosts.get("evt-1")!;
      expect(hostList).toHaveLength(1);
      expect(hostList[0].email).toBe("host@example.com");
    });

    it("passes --access-level option", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "add",
        "--event-id",
        "evt-1",
        "--email",
        "host@example.com",
        "--access-level",
        "check-in",
      ]);
      expect(result.exitCode).toBe(0);

      const hostList = luma.hosts.get("evt-1")!;
      expect(hostList[0].access_level).toBe("check-in");
    });

    it("passes --name option", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "add",
        "--event-id",
        "evt-1",
        "--email",
        "host@example.com",
        "--name",
        "Jane Doe",
      ]);
      expect(result.exitCode).toBe(0);

      const hostList = luma.hosts.get("evt-1")!;
      expect(hostList[0].name).toBe("Jane Doe");
    });

    it("passes --no-visible flag", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "add",
        "--event-id",
        "evt-1",
        "--email",
        "host@example.com",
        "--no-visible",
      ]);
      expect(result.exitCode).toBe(0);

      const hostList = luma.hosts.get("evt-1")!;
      expect(hostList[0].is_visible).toBe(false);
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "add",
        "--email",
        "host@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --email flag", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "add",
        "--event-id",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("hosts update", () => {
    it("updates a host access level", async () => {
      luma.hosts.set("evt-1", [
        {
          event_id: "evt-1",
          email: "host@example.com",
          access_level: "manager",
          is_visible: true,
          name: null,
          is_creator: false,
        },
      ]);

      const result = await runCommand(luma, [
        "hosts",
        "update",
        "--event-id",
        "evt-1",
        "--email",
        "host@example.com",
        "--access-level",
        "none",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.updated).toBe(true);
      expect(result.exitCode).toBe(0);

      expect(luma.hosts.get("evt-1")![0].access_level).toBe("none");
    });

    it("shows error when host not found", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "update",
        "--event-id",
        "evt-1",
        "--email",
        "nobody@example.com",
        "--access-level",
        "none",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "update",
        "--email",
        "host@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --email flag", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "update",
        "--event-id",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("hosts remove", () => {
    it("removes a host", async () => {
      luma.hosts.set("evt-1", [
        {
          event_id: "evt-1",
          email: "host@example.com",
          access_level: "manager",
          is_visible: true,
          name: null,
          is_creator: false,
        },
      ]);

      const result = await runCommand(luma, [
        "hosts",
        "remove",
        "--event-id",
        "evt-1",
        "--email",
        "host@example.com",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.removed).toBe(true);
      expect(result.exitCode).toBe(0);

      expect(luma.hosts.get("evt-1")).toHaveLength(0);
    });

    it("shows error when removing event creator", async () => {
      luma.hosts.set("evt-1", [
        {
          event_id: "evt-1",
          email: "creator@example.com",
          access_level: "manager",
          is_visible: true,
          name: null,
          is_creator: true,
        },
      ]);

      const result = await runCommand(luma, [
        "hosts",
        "remove",
        "--event-id",
        "evt-1",
        "--email",
        "creator@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("400");
    });

    it("shows error when host not found", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "remove",
        "--event-id",
        "evt-1",
        "--email",
        "nobody@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "remove",
        "--email",
        "host@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --email flag", async () => {
      const result = await runCommand(luma, [
        "hosts",
        "remove",
        "--event-id",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("hosts --help", () => {
    it("shows hosts subcommand help with available actions", async () => {
      const result = await runCommand(luma, ["hosts", "--help"]);
      expect(result.stdout).toContain("add");
      expect(result.stdout).toContain("update");
      expect(result.stdout).toContain("remove");
    });
  });
});
