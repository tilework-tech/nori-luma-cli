import { describe, it, expect, beforeEach } from "vitest";
import { createMockLumaService, runCommand, makeSelfUser } from "../helpers.js";

describe("utility command", () => {
  let luma: ReturnType<typeof createMockLumaService>;

  beforeEach(() => {
    luma = createMockLumaService();
  });

  it("shows help with subcommands", async () => {
    const result = await runCommand(luma, ["utility", "--help"]);
    expect(result.stdout).toContain("get-self");
    expect(result.stdout).toContain("entity-lookup");
    expect(result.stdout).toContain("image-upload");
  });

  describe("utility get-self", () => {
    it("returns authenticated user info", async () => {
      luma.selfUser = makeSelfUser({
        id: "usr-123",
        email: "user@example.com",
        name: "Test User",
      });

      const result = await runCommand(luma, ["utility", "get-self"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.id).toBe("usr-123");
      expect(output.email).toBe("user@example.com");
      expect(output.name).toBe("Test User");
    });

    it("returns user with null name fields", async () => {
      luma.selfUser = makeSelfUser({
        name: null,
        first_name: null,
        last_name: null,
      });

      const result = await runCommand(luma, ["utility", "get-self"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.name).toBeNull();
      expect(output.first_name).toBeNull();
      expect(output.last_name).toBeNull();
    });
  });

  describe("utility entity-lookup", () => {
    it("returns calendar entity when slug matches a calendar", async () => {
      luma.entityLookupResults.set("my-community", {
        type: "calendar",
        calendar: {
          id: "cal-123",
          api_id: "cal-123",
          name: "My Community",
          slug: "my-community",
          avatar_url: null,
        },
      });

      const result = await runCommand(luma, ["utility", "entity-lookup", "--slug", "my-community"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entity.type).toBe("calendar");
      expect(output.entity.calendar.id).toBe("cal-123");
      expect(output.entity.calendar.name).toBe("My Community");
    });

    it("returns event entity when slug matches an event", async () => {
      luma.entityLookupResults.set("cool-event", {
        type: "event",
        event: {
          id: "evt-456",
          api_id: "evt-456",
          name: "Cool Event",
          slug: "cool-event",
          cover_url: "https://example.com/cover.png",
          start_at: "2024-06-15T18:00:00.000Z",
          end_at: "2024-06-15T20:00:00.000Z",
        },
      });

      const result = await runCommand(luma, ["utility", "entity-lookup", "--slug", "cool-event"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entity.type).toBe("event");
      expect(output.entity.event.id).toBe("evt-456");
      expect(output.entity.event.name).toBe("Cool Event");
    });

    it("returns null entity when slug not found", async () => {
      const result = await runCommand(luma, ["utility", "entity-lookup", "--slug", "nonexistent"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entity).toBeNull();
    });

    it("requires --slug", async () => {
      const result = await runCommand(luma, ["utility", "entity-lookup"]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("utility image-upload", () => {
    it("returns upload_url and file_url", async () => {
      const result = await runCommand(luma, ["utility", "image-upload"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.upload_url).toBeTruthy();
      expect(output.file_url).toBeTruthy();
    });

    it("passes content_type when flag provided", async () => {
      const result = await runCommand(luma, [
        "utility", "image-upload",
        "--content-type", "image/png",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.upload_url).toBeTruthy();
      expect(output.file_url).toBeTruthy();
      expect(luma.lastCreateUploadUrlParams?.content_type).toBe("image/png");
    });

  });
});
