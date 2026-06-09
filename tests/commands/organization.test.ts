import { describe, it, expect, beforeEach } from "vitest";
import { createMockLumaService, runCommand, makeCalendar, makeAdmin, makeOrgEvent } from "../helpers.js";

describe("organization command", () => {
  let luma: ReturnType<typeof createMockLumaService>;

  beforeEach(() => {
    luma = createMockLumaService();
  });

  it("shows help with subcommands", async () => {
    const result = await runCommand(luma, ["organization", "--help"]);
    expect(result.stdout).toContain("list-admins");
    expect(result.stdout).toContain("list-calendars");
    expect(result.stdout).toContain("list-events");
    expect(result.stdout).toContain("transfer-event");
    expect(result.stdout).toContain("create-calendar");
  });

  describe("organization list-admins", () => {
    it("returns admin entries", async () => {
      luma.orgAdmins.push(
        makeAdmin({ id: "usr-1", email: "admin1@example.com", name: "Admin One" }),
        makeAdmin({ id: "usr-2", email: "admin2@example.com", name: "Admin Two" })
      );

      const result = await runCommand(luma, ["organization", "list-admins"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.entries[0].email).toBe("admin1@example.com");
    });

    it("returns empty entries when no admins exist", async () => {
      const result = await runCommand(luma, ["organization", "list-admins"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(0);
    });
  });

  describe("organization list-calendars", () => {
    it("returns paginated calendar entries", async () => {
      luma.orgCalendars.push(
        makeCalendar({ id: "cal-1", name: "Calendar One" }),
        makeCalendar({ id: "cal-2", name: "Calendar Two" })
      );

      const result = await runCommand(luma, ["organization", "list-calendars"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.entries[0].name).toBe("Calendar One");
      expect(output.has_more).toBe(false);
    });

    it("supports pagination with --limit and --cursor", async () => {
      luma.orgCalendars.push(
        makeCalendar({ id: "cal-1", name: "Cal A" }),
        makeCalendar({ id: "cal-2", name: "Cal B" }),
        makeCalendar({ id: "cal-3", name: "Cal C" })
      );

      const result = await runCommand(luma, ["organization", "list-calendars", "--limit", "2"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.has_more).toBe(true);
      expect(output.next_cursor).toBeTruthy();

      const result2 = await runCommand(luma, ["organization", "list-calendars", "--limit", "2", "--cursor", output.next_cursor]);
      expect(result2.exitCode).toBe(0);
      const output2 = JSON.parse(result2.stdout);
      expect(output2.entries).toHaveLength(1);
      expect(output2.has_more).toBe(false);
    });

    it("returns empty entries when no calendars exist", async () => {
      const result = await runCommand(luma, ["organization", "list-calendars"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(0);
      expect(output.has_more).toBe(false);
    });
  });

  describe("organization list-events", () => {
    it("returns paginated event entries", async () => {
      luma.orgEvents.push(
        makeOrgEvent({ id: "evt-1", name: "Event One" }),
        makeOrgEvent({ id: "evt-2", name: "Event Two" })
      );

      const result = await runCommand(luma, ["organization", "list-events"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.entries[0].name).toBe("Event One");
      expect(output.has_more).toBe(false);
    });

    it("supports --before and --after filters", async () => {
      luma.orgEvents.push(
        makeOrgEvent({ id: "evt-1", name: "Early", start_at: "2024-01-01T00:00:00.000Z" }),
        makeOrgEvent({ id: "evt-2", name: "Mid", start_at: "2024-06-15T00:00:00.000Z" }),
        makeOrgEvent({ id: "evt-3", name: "Late", start_at: "2024-12-01T00:00:00.000Z" })
      );

      const result = await runCommand(luma, [
        "organization", "list-events",
        "--after", "2024-03-01T00:00:00.000Z",
        "--before", "2024-09-01T00:00:00.000Z",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(output.entries[0].name).toBe("Mid");
    });

    it("supports pagination with --limit and --cursor", async () => {
      luma.orgEvents.push(
        makeOrgEvent({ id: "evt-1", name: "A" }),
        makeOrgEvent({ id: "evt-2", name: "B" }),
        makeOrgEvent({ id: "evt-3", name: "C" })
      );

      const result = await runCommand(luma, ["organization", "list-events", "--limit", "2"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.has_more).toBe(true);

      const result2 = await runCommand(luma, ["organization", "list-events", "--limit", "2", "--cursor", output.next_cursor]);
      expect(result2.exitCode).toBe(0);
      const output2 = JSON.parse(result2.stdout);
      expect(output2.entries).toHaveLength(1);
      expect(output2.has_more).toBe(false);
    });

    it("passes --sort-direction to the service", async () => {
      luma.orgEvents.push(
        makeOrgEvent({ id: "evt-1", name: "A" })
      );

      const result = await runCommand(luma, [
        "organization", "list-events", "--sort-direction", "desc",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(luma.lastListOrgEventsParams?.sortDirection).toBe("desc");
    });

    it("returns empty entries when no events exist", async () => {
      const result = await runCommand(luma, ["organization", "list-events"]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(0);
      expect(output.has_more).toBe(false);
    });
  });

  describe("organization transfer-event", () => {
    it("transfers an event and outputs confirmation", async () => {
      luma.orgEvents.push(makeOrgEvent({ id: "evt-1", calendar_id: "cal-1" }));
      luma.orgCalendars.push(makeCalendar({ id: "cal-2" }));

      const result = await runCommand(luma, [
        "organization", "transfer-event",
        "--event-id", "evt-1",
        "--calendar-id", "cal-2",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.transferred).toBe(true);
      expect(output.event_id).toBe("evt-1");
      expect(output.calendar_id).toBe("cal-2");
    });

    it("requires --event-id", async () => {
      const result = await runCommand(luma, [
        "organization", "transfer-event",
        "--calendar-id", "cal-2",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --calendar-id", async () => {
      const result = await runCommand(luma, [
        "organization", "transfer-event",
        "--event-id", "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("fails when event not found", async () => {
      const result = await runCommand(luma, [
        "organization", "transfer-event",
        "--event-id", "evt-nonexistent",
        "--calendar-id", "cal-1",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });

    it("fails when destination calendar not found", async () => {
      luma.orgEvents.push(makeOrgEvent({ id: "evt-1" }));

      const result = await runCommand(luma, [
        "organization", "transfer-event",
        "--event-id", "evt-1",
        "--calendar-id", "cal-nonexistent",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("organization create-calendar", () => {
    it("creates a calendar and outputs the result", async () => {
      const result = await runCommand(luma, [
        "organization", "create-calendar",
        "--name", "My Community",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.name).toBe("My Community");
      expect(output.id).toBeTruthy();
    });

    it("supports optional --slug, --description, --avatar-url, --tint-color", async () => {
      const result = await runCommand(luma, [
        "organization", "create-calendar",
        "--name", "My Community",
        "--slug", "my-community",
        "--description", "A great community",
        "--avatar-url", "https://cdn.luma.com/avatar.png",
        "--tint-color", "#E3CBEF",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.name).toBe("My Community");
      expect(output.slug).toBe("my-community");
      expect(output.description).toBe("A great community");
      expect(output.avatar_url).toBe("https://cdn.luma.com/avatar.png");
      expect(luma.lastCreateCalendarParams?.tint_color).toBe("#E3CBEF");
    });

    it("requires --name", async () => {
      const result = await runCommand(luma, [
        "organization", "create-calendar",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });
});
