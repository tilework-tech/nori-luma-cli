import { describe, it, expect, beforeEach } from "vitest";
import { createMockLumaService, makeEvent, makeCoupon, runCommand } from "../helpers.js";

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

    it("passes --platforms filter", async () => {
      await runCommand(luma, ["events", "list", "--platforms", "luma,external"]);
      expect(luma.lastListEventsParams?.platforms).toEqual(["luma", "external"]);
    });

    it("passes --sort-column and --sort-direction", async () => {
      await runCommand(luma, [
        "events",
        "list",
        "--sort-column",
        "start_at",
        "--sort-direction",
        "desc",
      ]);
      expect(luma.lastListEventsParams?.sortColumn).toBe("start_at");
      expect(luma.lastListEventsParams?.sortDirection).toBe("desc");
    });

    it("passes --status filter", async () => {
      await runCommand(luma, ["events", "list", "--status", "approved"]);
      expect(luma.lastListEventsParams?.status).toBe("approved");
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
      expect(output.event.description).toBe("A great event");
      expect(output.event.meeting_url).toBe("https://zoom.us/j/123");
      expect(output.event.visibility).toBe("public");
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

    it("passes --tint-color", async () => {
      await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--tint-color", "#E3CBEF",
      ]);
      expect(luma.lastCreateEventParams?.tint_color).toBe("#E3CBEF");
    });

    it("passes --show-guest-list flag", async () => {
      await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--show-guest-list",
      ]);
      expect(luma.lastCreateEventParams?.show_guest_list).toBe(true);
    });

    it("passes --reminders-disabled flag", async () => {
      await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--reminders-disabled",
      ]);
      expect(luma.lastCreateEventParams?.reminders_disabled).toBe(true);
    });

    it("passes --name-requirement", async () => {
      await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--name-requirement", "full-name",
      ]);
      expect(luma.lastCreateEventParams?.name_requirement).toBe("full-name");
    });

    it("passes --phone-number-requirement", async () => {
      await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--phone-number-requirement", "required",
      ]);
      expect(luma.lastCreateEventParams?.phone_number_requirement).toBe("required");
    });

    it("passes --can-register-for-multiple-tickets flag", async () => {
      await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--can-register-for-multiple-tickets",
      ]);
      expect(luma.lastCreateEventParams?.can_register_for_multiple_tickets).toBe(true);
    });

    it("passes --latitude and --longitude as coordinate", async () => {
      await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--latitude", "40.7128", "--longitude", "-74.006",
      ]);
      expect(luma.lastCreateEventParams?.coordinate).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it("passes --geo-address-json as parsed JSON", async () => {
      const geoJson = JSON.stringify({ type: "manual", address: "123 Main St" });
      await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--geo-address-json", geoJson,
      ]);
      expect(luma.lastCreateEventParams?.geo_address_json).toEqual({ type: "manual", address: "123 Main St" });
    });

    it("passes --registration-questions as parsed JSON", async () => {
      const questions = JSON.stringify([{ type: "text", question: "Company?" }]);
      await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--registration-questions", questions,
      ]);
      expect(luma.lastCreateEventParams?.registration_questions).toEqual([{ type: "text", question: "Company?" }]);
    });

    it("passes --feedback-email as parsed JSON", async () => {
      const feedbackEmail = JSON.stringify({ enabled: true, delay: "P1D" });
      await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--feedback-email", feedbackEmail,
      ]);
      expect(luma.lastCreateEventParams?.feedback_email).toEqual({ enabled: true, delay: "P1D" });
    });

    it("errors when only --latitude is provided without --longitude", async () => {
      const result = await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--latitude", "40.7128",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("--latitude and --longitude must both be provided");
    });

    it("errors on invalid JSON for --geo-address-json", async () => {
      const result = await runCommand(luma, [
        "events", "create", "--name", "Test", "--start-at", "2024-07-01T18:00:00Z",
        "--timezone", "America/New_York", "--geo-address-json", "not-json",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("invalid JSON");
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

    it("passes --tint-color", async () => {
      luma.events.set("evt-up", makeEvent({ api_id: "evt-up" }));
      await runCommand(luma, ["events", "update", "--event-id", "evt-up", "--tint-color", "#ABC123"]);
      expect(luma.lastUpdateEventParams?.tint_color).toBe("#ABC123");
    });

    it("passes --show-guest-list flag", async () => {
      luma.events.set("evt-up", makeEvent({ api_id: "evt-up" }));
      await runCommand(luma, ["events", "update", "--event-id", "evt-up", "--show-guest-list"]);
      expect(luma.lastUpdateEventParams?.show_guest_list).toBe(true);
    });

    it("passes --reminders-disabled flag", async () => {
      luma.events.set("evt-up", makeEvent({ api_id: "evt-up" }));
      await runCommand(luma, ["events", "update", "--event-id", "evt-up", "--reminders-disabled"]);
      expect(luma.lastUpdateEventParams?.reminders_disabled).toBe(true);
    });

    it("passes --name-requirement", async () => {
      luma.events.set("evt-up", makeEvent({ api_id: "evt-up" }));
      await runCommand(luma, ["events", "update", "--event-id", "evt-up", "--name-requirement", "first-last"]);
      expect(luma.lastUpdateEventParams?.name_requirement).toBe("first-last");
    });

    it("passes --phone-number-requirement", async () => {
      luma.events.set("evt-up", makeEvent({ api_id: "evt-up" }));
      await runCommand(luma, ["events", "update", "--event-id", "evt-up", "--phone-number-requirement", "optional"]);
      expect(luma.lastUpdateEventParams?.phone_number_requirement).toBe("optional");
    });

    it("passes --can-register-for-multiple-tickets flag", async () => {
      luma.events.set("evt-up", makeEvent({ api_id: "evt-up" }));
      await runCommand(luma, ["events", "update", "--event-id", "evt-up", "--can-register-for-multiple-tickets"]);
      expect(luma.lastUpdateEventParams?.can_register_for_multiple_tickets).toBe(true);
    });

    it("passes --latitude and --longitude as coordinate", async () => {
      luma.events.set("evt-up", makeEvent({ api_id: "evt-up" }));
      await runCommand(luma, ["events", "update", "--event-id", "evt-up", "--latitude", "51.5", "--longitude", "-0.12"]);
      expect(luma.lastUpdateEventParams?.coordinate).toEqual({ latitude: 51.5, longitude: -0.12 });
    });

    it("passes --geo-address-json as parsed JSON", async () => {
      luma.events.set("evt-up", makeEvent({ api_id: "evt-up" }));
      const geoJson = JSON.stringify({ type: "google", place_id: "ChIJN1t", description: "Sydney" });
      await runCommand(luma, ["events", "update", "--event-id", "evt-up", "--geo-address-json", geoJson]);
      expect(luma.lastUpdateEventParams?.geo_address_json).toEqual({ type: "google", place_id: "ChIJN1t", description: "Sydney" });
    });

    it("passes --registration-questions as parsed JSON", async () => {
      luma.events.set("evt-up", makeEvent({ api_id: "evt-up" }));
      const questions = JSON.stringify([{ type: "text", question: "Role?" }]);
      await runCommand(luma, ["events", "update", "--event-id", "evt-up", "--registration-questions", questions]);
      expect(luma.lastUpdateEventParams?.registration_questions).toEqual([{ type: "text", question: "Role?" }]);
    });

    it("passes --feedback-email as parsed JSON", async () => {
      luma.events.set("evt-up", makeEvent({ api_id: "evt-up" }));
      const fe = JSON.stringify({ enabled: false });
      await runCommand(luma, ["events", "update", "--event-id", "evt-up", "--feedback-email", fe]);
      expect(luma.lastUpdateEventParams?.feedback_email).toEqual({ enabled: false });
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

  describe("events list-coupons", () => {
    it("lists coupons for an event as JSON", async () => {
      const coupon = makeCoupon({ id: "cpn-1", code: "SAVE10", percent_off: 10 });
      luma.eventCoupons.set("evt-1", [coupon]);

      const result = await runCommand(luma, [
        "events",
        "list-coupons",
        "--event-id",
        "evt-1",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(output.entries[0].code).toBe("SAVE10");
      expect(output.entries[0].percent_off).toBe(10);
    });

    it("supports --limit for pagination", async () => {
      const coupons = Array.from({ length: 5 }, (_, i) =>
        makeCoupon({ id: `cpn-${i}`, code: `CODE${i}` })
      );
      luma.eventCoupons.set("evt-1", coupons);

      const result = await runCommand(luma, [
        "events",
        "list-coupons",
        "--event-id",
        "evt-1",
        "--limit",
        "2",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.has_more).toBe(true);
    });

    it("supports --cursor for pagination continuation", async () => {
      const coupons = Array.from({ length: 5 }, (_, i) =>
        makeCoupon({ id: `cpn-${i}`, code: `CODE${i}` })
      );
      luma.eventCoupons.set("evt-1", coupons);

      const result = await runCommand(luma, [
        "events",
        "list-coupons",
        "--event-id",
        "evt-1",
        "--limit",
        "2",
        "--cursor",
        "2",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, ["events", "list-coupons"]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("events create-coupon", () => {
    it("creates a percent discount coupon", async () => {
      const result = await runCommand(luma, [
        "events",
        "create-coupon",
        "--event-id",
        "evt-1",
        "--code",
        "SAVE20",
        "--discount-type",
        "percent",
        "--percent-off",
        "20",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.code).toBe("SAVE20");
      expect(output.percent_off).toBe(20);
      expect(output.id).toBeTruthy();
    });

    it("creates an amount discount coupon", async () => {
      const result = await runCommand(luma, [
        "events",
        "create-coupon",
        "--event-id",
        "evt-1",
        "--code",
        "FLAT5",
        "--discount-type",
        "amount",
        "--cents-off",
        "500",
        "--currency",
        "usd",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.code).toBe("FLAT5");
      expect(output.cents_off).toBe(500);
      expect(output.currency).toBe("usd");
    });

    it("passes optional fields", async () => {
      const result = await runCommand(luma, [
        "events",
        "create-coupon",
        "--event-id",
        "evt-1",
        "--code",
        "EARLY",
        "--discount-type",
        "percent",
        "--percent-off",
        "15",
        "--remaining-count",
        "50",
        "--valid-start-at",
        "2024-06-01T00:00:00Z",
        "--valid-end-at",
        "2024-12-31T23:59:59Z",
        "--event-ticket-type-id",
        "ett-123",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.remaining_count).toBe(50);
      expect(output.valid_start_at).toBe("2024-06-01T00:00:00Z");
      expect(output.valid_end_at).toBe("2024-12-31T23:59:59Z");
      expect(output.event_ticket_type_id).toBe("ett-123");
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "events",
        "create-coupon",
        "--code",
        "TEST",
        "--discount-type",
        "percent",
        "--percent-off",
        "10",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --code flag", async () => {
      const result = await runCommand(luma, [
        "events",
        "create-coupon",
        "--event-id",
        "evt-1",
        "--discount-type",
        "percent",
        "--percent-off",
        "10",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --discount-type flag", async () => {
      const result = await runCommand(luma, [
        "events",
        "create-coupon",
        "--event-id",
        "evt-1",
        "--code",
        "TEST",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("events update-coupon", () => {
    it("updates a coupon by code", async () => {
      const coupon = makeCoupon({ id: "cpn-1", code: "SAVE10" });
      luma.eventCoupons.set("evt-1", [coupon]);

      const result = await runCommand(luma, [
        "events",
        "update-coupon",
        "--event-id",
        "evt-1",
        "--code",
        "SAVE10",
        "--remaining-count",
        "50",
      ]);
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.updated).toBe(true);
      expect(output.code).toBe("SAVE10");
    });

    it("requires --event-id flag", async () => {
      const result = await runCommand(luma, [
        "events",
        "update-coupon",
        "--code",
        "TEST",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("requires --code flag", async () => {
      const result = await runCommand(luma, [
        "events",
        "update-coupon",
        "--event-id",
        "evt-1",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("shows error when coupon not found", async () => {
      const result = await runCommand(luma, [
        "events",
        "update-coupon",
        "--event-id",
        "evt-1",
        "--code",
        "NONEXISTENT",
        "--remaining-count",
        "10",
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
      expect(result.stdout).toContain("list-coupons");
      expect(result.stdout).toContain("create-coupon");
      expect(result.stdout).toContain("update-coupon");
    });
  });
});
