import { describe, it, expect, beforeEach } from "vitest";
import {
  createMockLumaService,
  makeAdmin,
  makeCoupon,
  makeEventTag,
  makeEvent,
  runCommand,
} from "../helpers.js";

describe("calendar command", () => {
  let luma: ReturnType<typeof createMockLumaService>;

  beforeEach(() => {
    luma = createMockLumaService();
  });

  describe("calendar get", () => {
    it("outputs calendar details as JSON", async () => {
      luma.calendar.name = "My Calendar";
      luma.calendar.slug = "my-cal";

      const result = await runCommand(luma, ["calendar", "get"]);
      const output = JSON.parse(result.stdout);
      expect(output.name).toBe("My Calendar");
      expect(output.slug).toBe("my-cal");
      expect(output.id).toBeDefined();
      expect(result.exitCode).toBe(0);
    });
  });

  describe("calendar lookup-event", () => {
    it("finds an event on the calendar", async () => {
      luma.calendarEvents.push({
        id: "calev-1",
        api_id: "calev-1",
        status: "approved",
        event_id: "evt-1",
      });

      const result = await runCommand(luma, [
        "calendar",
        "lookup-event",
        "--event-id",
        "evt-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.event).not.toBeNull();
      expect(output.event.status).toBe("approved");
      expect(result.exitCode).toBe(0);
    });

    it("returns null event when not found", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "lookup-event",
        "--event-id",
        "evt-missing",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.event).toBeNull();
      expect(result.exitCode).toBe(0);
    });
  });

  describe("calendar add-event", () => {
    it("adds a luma event to the calendar", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "add-event",
        "--platform",
        "luma",
        "--event-id",
        "evt-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.id).toBeDefined();
      expect(output.status).toBe("approved");
      expect(result.exitCode).toBe(0);
    });

    it("adds an external event to the calendar", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "add-event",
        "--platform",
        "external",
        "--url",
        "https://example.com/event",
        "--name",
        "External Event",
        "--start-at",
        "2024-07-01T18:00:00Z",
        "--duration-interval",
        "PT2H",
        "--timezone",
        "America/New_York",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.id).toBeDefined();
      expect(output.status).toBe("approved");
      expect(result.exitCode).toBe(0);
    });

    it("supports --submission-mode pending", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "add-event",
        "--platform",
        "luma",
        "--event-id",
        "evt-1",
        "--submission-mode",
        "pending",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.status).toBe("pending");
      expect(result.exitCode).toBe(0);
    });

    it("requires --platform flag", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "add-event",
        "--event-id",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("passes --latitude and --longitude for external event", async () => {
      await runCommand(luma, [
        "calendar", "add-event", "--platform", "external",
        "--url", "https://example.com/event", "--name", "Geo Event",
        "--start-at", "2024-07-01T18:00:00Z", "--duration-interval", "PT2H",
        "--timezone", "America/New_York",
        "--latitude", "40.7128", "--longitude", "-74.006",
      ]);
      const params = luma.lastAddEventParams;
      expect(params).toBeDefined();
      expect((params as Record<string, unknown>).coordinate).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it("passes --geo-address-json for external event", async () => {
      const geoJson = JSON.stringify({ type: "manual", address: "123 Main St" });
      await runCommand(luma, [
        "calendar", "add-event", "--platform", "external",
        "--url", "https://example.com/event", "--name", "Geo Event",
        "--start-at", "2024-07-01T18:00:00Z", "--duration-interval", "PT2H",
        "--timezone", "America/New_York",
        "--geo-address-json", geoJson,
      ]);
      const params = luma.lastAddEventParams;
      expect(params).toBeDefined();
      expect((params as Record<string, unknown>).geo_address_json).toEqual({ type: "manual", address: "123 Main St" });
    });

    it("passes --geo-latitude and --geo-longitude for external event", async () => {
      await runCommand(luma, [
        "calendar", "add-event", "--platform", "external",
        "--url", "https://example.com/event", "--name", "Geo Event",
        "--start-at", "2024-07-01T18:00:00Z", "--duration-interval", "PT2H",
        "--timezone", "America/New_York",
        "--geo-latitude", "51.5074", "--geo-longitude", "-0.1278",
      ]);
      const params = luma.lastAddEventParams;
      expect(params).toBeDefined();
      expect((params as Record<string, unknown>).geo_latitude).toBe(51.5074);
      expect((params as Record<string, unknown>).geo_longitude).toBe(-0.1278);
    });
  });

  describe("calendar approve-event", () => {
    it("approves a pending event", async () => {
      luma.calendarEvents.push({
        id: "calev-1",
        api_id: "calev-1",
        status: "pending",
        event_id: "evt-1",
      });

      const result = await runCommand(luma, [
        "calendar",
        "approve-event",
        "--calendar-event-id",
        "calev-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.approved).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it("requires --calendar-event-id flag", async () => {
      const result = await runCommand(luma, ["calendar", "approve-event"]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when event not found", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "approve-event",
        "--calendar-event-id",
        "calev-missing",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("calendar reject-event", () => {
    it("rejects a pending event", async () => {
      luma.calendarEvents.push({
        id: "calev-1",
        api_id: "calev-1",
        status: "pending",
        event_id: "evt-1",
      });

      const result = await runCommand(luma, [
        "calendar",
        "reject-event",
        "--calendar-event-id",
        "calev-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.rejected).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it("passes optional --message flag", async () => {
      luma.calendarEvents.push({
        id: "calev-1",
        api_id: "calev-1",
        status: "pending",
        event_id: "evt-1",
      });

      const result = await runCommand(luma, [
        "calendar",
        "reject-event",
        "--calendar-event-id",
        "calev-1",
        "--message",
        "Not a good fit",
      ]);
      expect(result.exitCode).toBe(0);
      expect(luma.lastRejectEventParams?.message).toBe("Not a good fit");
    });

    it("requires --calendar-event-id flag", async () => {
      const result = await runCommand(luma, ["calendar", "reject-event"]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when event not found", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "reject-event",
        "--calendar-event-id",
        "calev-missing",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("calendar list-admins", () => {
    it("lists calendar admins as JSON", async () => {
      luma.calendarAdmins.push(makeAdmin({ email: "admin1@test.com" }));
      luma.calendarAdmins.push(makeAdmin({ id: "usr-2", email: "admin2@test.com" }));

      const result = await runCommand(luma, ["calendar", "list-admins"]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.entries[0].email).toBe("admin1@test.com");
      expect(result.exitCode).toBe(0);
    });

    it("returns empty entries when no admins", async () => {
      const result = await runCommand(luma, ["calendar", "list-admins"]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toEqual([]);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("calendar list-coupons", () => {
    it("lists calendar coupons as JSON", async () => {
      luma.calendarCoupons.push(makeCoupon({ code: "SAVE10" }));

      const result = await runCommand(luma, ["calendar", "list-coupons"]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(output.entries[0].code).toBe("SAVE10");
      expect(result.exitCode).toBe(0);
    });

    it("supports pagination options", async () => {
      for (let i = 0; i < 5; i++) {
        luma.calendarCoupons.push(makeCoupon({ id: `cpn-${i}`, code: `CODE${i}` }));
      }

      const result = await runCommand(luma, [
        "calendar",
        "list-coupons",
        "--limit",
        "2",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.has_more).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it("passes --cursor for pagination", async () => {
      for (let i = 0; i < 5; i++) {
        luma.calendarCoupons.push(makeCoupon({ id: `cpn-${i}`, code: `CODE${i}` }));
      }

      const result = await runCommand(luma, [
        "calendar",
        "list-coupons",
        "--limit",
        "2",
        "--cursor",
        "2",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("calendar create-coupon", () => {
    it("creates a percent discount coupon", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "create-coupon",
        "--code",
        "HALF50",
        "--discount-type",
        "percent",
        "--percent-off",
        "50",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.code).toBe("HALF50");
      expect(output.percent_off).toBe(50);
      expect(result.exitCode).toBe(0);
    });

    it("creates an amount discount coupon", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "create-coupon",
        "--code",
        "SAVE10",
        "--discount-type",
        "amount",
        "--cents-off",
        "1000",
        "--currency",
        "usd",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.code).toBe("SAVE10");
      expect(output.cents_off).toBe(1000);
      expect(output.currency).toBe("usd");
      expect(result.exitCode).toBe(0);
    });

    it("passes optional fields", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "create-coupon",
        "--code",
        "LIMITED",
        "--discount-type",
        "percent",
        "--percent-off",
        "25",
        "--remaining-count",
        "100",
        "--valid-start-at",
        "2025-01-01",
        "--valid-end-at",
        "2025-12-31",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.remaining_count).toBe(100);
      expect(output.valid_start_at).toBe("2025-01-01");
      expect(output.valid_end_at).toBe("2025-12-31");
      expect(result.exitCode).toBe(0);
    });

    it("requires --code flag", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "create-coupon",
        "--discount-type",
        "percent",
        "--percent-off",
        "50",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --discount-type flag", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "create-coupon",
        "--code",
        "TEST",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("calendar update-coupon", () => {
    it("updates a coupon by code", async () => {
      luma.calendarCoupons.push(makeCoupon({ code: "SAVE10", remaining_count: 100 }));

      const result = await runCommand(luma, [
        "calendar",
        "update-coupon",
        "--code",
        "SAVE10",
        "--remaining-count",
        "50",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.updated).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it("requires --code flag", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "update-coupon",
        "--remaining-count",
        "50",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when coupon not found", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "update-coupon",
        "--code",
        "MISSING",
        "--remaining-count",
        "50",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("calendar list-event-tags", () => {
    it("lists event tags as JSON", async () => {
      luma.eventTags.push(makeEventTag({ name: "Conference" }));
      luma.eventTags.push(makeEventTag({ id: "tag-2", name: "Workshop" }));

      const result = await runCommand(luma, ["calendar", "list-event-tags"]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.entries[0].name).toBe("Conference");
      expect(result.exitCode).toBe(0);
    });

    it("returns empty entries when no tags", async () => {
      const result = await runCommand(luma, ["calendar", "list-event-tags"]);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toEqual([]);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("calendar create-event-tag", () => {
    it("creates an event tag with name", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "create-event-tag",
        "--name",
        "Workshop",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.tag_id).toBeDefined();
      expect(result.exitCode).toBe(0);
    });

    it("creates an event tag with color", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "create-event-tag",
        "--name",
        "Important",
        "--color",
        "red",
      ]);
      expect(result.exitCode).toBe(0);
      expect(luma.eventTags).toHaveLength(1);
      expect(luma.eventTags[0].color).toBe("red");
    });

    it("requires --name flag", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "create-event-tag",
        "--color",
        "blue",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("calendar update-event-tag", () => {
    it("updates an event tag name", async () => {
      luma.eventTags.push(makeEventTag({ id: "tag-1", name: "Old Name" }));

      const result = await runCommand(luma, [
        "calendar",
        "update-event-tag",
        "--tag-id",
        "tag-1",
        "--name",
        "New Name",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.updated).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it("requires --tag-id flag", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "update-event-tag",
        "--name",
        "Test",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when tag not found", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "update-event-tag",
        "--tag-id",
        "tag-missing",
        "--name",
        "Test",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("calendar delete-event-tag", () => {
    it("deletes an event tag", async () => {
      luma.eventTags.push(makeEventTag({ id: "tag-1" }));

      const result = await runCommand(luma, [
        "calendar",
        "delete-event-tag",
        "--tag-id",
        "tag-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.deleted).toBe(true);
      expect(result.exitCode).toBe(0);

      expect(luma.eventTags).toHaveLength(0);
    });

    it("requires --tag-id flag", async () => {
      const result = await runCommand(luma, ["calendar", "delete-event-tag"]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when tag not found", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "delete-event-tag",
        "--tag-id",
        "tag-missing",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("calendar apply-event-tag", () => {
    it("applies a tag to events", async () => {
      luma.eventTags.push(makeEventTag({ id: "tag-1", name: "Featured" }));
      luma.events.set("evt-1", makeEvent({ api_id: "evt-1" }));
      luma.events.set("evt-2", makeEvent({ api_id: "evt-2" }));

      const result = await runCommand(luma, [
        "calendar",
        "apply-event-tag",
        "--tag",
        "tag-1",
        "--event-ids",
        "evt-1,evt-2",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.applied_count).toBe(2);
      expect(output.skipped_count).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it("requires --tag flag", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "apply-event-tag",
        "--event-ids",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when tag not found", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "apply-event-tag",
        "--tag",
        "nonexistent",
        "--event-ids",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("calendar unapply-event-tag", () => {
    it("removes a tag from events", async () => {
      luma.eventTags.push(makeEventTag({ id: "tag-1", name: "Featured" }));
      luma.events.set("evt-1", makeEvent({ api_id: "evt-1" }));

      const result = await runCommand(luma, [
        "calendar",
        "unapply-event-tag",
        "--tag",
        "tag-1",
        "--event-ids",
        "evt-1",
      ]);
      const output = JSON.parse(result.stdout);
      expect(output.removed_count).toBe(1);
      expect(output.skipped_count).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it("requires --tag flag", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "unapply-event-tag",
        "--event-ids",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when tag not found", async () => {
      const result = await runCommand(luma, [
        "calendar",
        "unapply-event-tag",
        "--tag",
        "nonexistent",
        "--event-ids",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });
  });

  describe("calendar --help", () => {
    it("shows calendar subcommand help with available actions", async () => {
      const result = await runCommand(luma, ["calendar", "--help"]);
      expect(result.stdout).toContain("get");
      expect(result.stdout).toContain("lookup-event");
      expect(result.stdout).toContain("add-event");
      expect(result.stdout).toContain("approve-event");
      expect(result.stdout).toContain("reject-event");
      expect(result.stdout).toContain("list-admins");
      expect(result.stdout).toContain("list-coupons");
      expect(result.stdout).toContain("create-coupon");
      expect(result.stdout).toContain("update-coupon");
      expect(result.stdout).toContain("list-event-tags");
      expect(result.stdout).toContain("create-event-tag");
      expect(result.stdout).toContain("update-event-tag");
      expect(result.stdout).toContain("delete-event-tag");
      expect(result.stdout).toContain("apply-event-tag");
      expect(result.stdout).toContain("unapply-event-tag");
    });
  });
});
