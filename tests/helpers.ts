import { createProgram } from "../src/program.js";
import type { Output } from "../src/output.js";
import type {
  LumaService,
  LumaEvent,
  LumaGuest,
  LumaTicketType,
  LumaCalendar,
  LumaCalendarAdmin,
  LumaCoupon,
  LumaEventTag,
  LumaContact,
  LumaContactTag,
  CalendarEventEntry,
  CreateEventParams,
  UpdateEventParams,
  ListEventsParams,
  ListGuestsParams,
  AddGuestsParams,
  UpdateGuestStatusParams,
  SendInvitesParams,
  CreateHostParams,
  UpdateHostParams,
  RemoveHostParams,
  ListTicketTypesParams,
  CreateTicketTypeParams,
  UpdateTicketTypeParams,
  DeleteTicketTypeParams,
  LookupEventParams,
  AddEventLumaParams,
  AddEventExternalParams,
  RejectEventParams,
  ListCouponsParams,
  CreateCouponParams,
  UpdateCouponParams,
  CreateEventTagParams,
  UpdateEventTagParams,
  ApplyEventTagParams,
  UnapplyEventTagParams,
  ListContactsParams,
  ImportContactsParams,
  CreateContactTagParams,
  UpdateContactTagParams,
  ApplyContactTagParams,
  UnapplyContactTagParams,
  LumaMembershipTier,
  ListMembershipTiersParams,
  AddMemberParams,
  UpdateMemberStatusParams,
} from "../src/services/luma.js";

export function createTestOutput(): Output & {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const out = {
    stdout: "",
    stderr: "",
    exitCode: 0,
    write(message: string) {
      out.stdout += message;
    },
    error(message: string) {
      out.stderr += message;
    },
    setExitCode(code: number) {
      out.exitCode = code;
    },
  };
  return out;
}

export function makeEvent(overrides: Partial<LumaEvent> = {}): LumaEvent {
  return {
    api_id: "evt-test-123",
    name: "Test Event",
    description: null,
    start_at: "2024-06-15T18:00:00.000Z",
    end_at: "2024-06-15T20:00:00.000Z",
    timezone: "America/New_York",
    cover_url: null,
    url: "https://lu.ma/test-event",
    visibility: "public",
    meeting_url: null,
    geo_address_json: null,
    created_at: "2024-06-01T00:00:00.000Z",
    updated_at: "2024-06-01T00:00:00.000Z",
    ...overrides,
  };
}

export interface MockHost {
  event_id: string;
  email: string;
  access_level: string;
  is_visible: boolean;
  name: string | null;
  is_creator: boolean;
}

export function makeGuest(overrides: Partial<LumaGuest> = {}): LumaGuest {
  return {
    id: "gst-test-123",
    user_id: "usr-test-123",
    user_email: "test@example.com",
    user_name: "Test User",
    user_first_name: "Test",
    user_last_name: "User",
    approval_status: "approved",
    check_in_qr_code: null,
    registered_at: "2024-06-15T18:00:00.000Z",
    invited_at: null,
    joined_at: null,
    phone_number: null,
    utm_source: null,
    event_tickets: [],
    ...overrides,
  };
}

export function makeTicketType(overrides: Partial<LumaTicketType> = {}): LumaTicketType {
  return {
    id: "ett-test-123",
    name: "General Admission",
    type: "free",
    require_approval: false,
    is_hidden: false,
    description: null,
    valid_start_at: null,
    valid_end_at: null,
    max_capacity: null,
    cents: null,
    currency: null,
    is_flexible: false,
    min_cents: null,
    ...overrides,
  };
}

export function makeCalendar(overrides: Partial<LumaCalendar> = {}): LumaCalendar {
  return {
    id: "cal-test-123",
    name: "Test Calendar",
    slug: "test-calendar",
    avatar_url: null,
    url: "https://lu.ma/cal/test-calendar",
    description: null,
    social_image_url: null,
    cover_image_url: null,
    is_personal: false,
    location: null,
    coordinate: null,
    instagram_handle: null,
    twitter_handle: null,
    youtube_handle: null,
    website: null,
    ...overrides,
  };
}

export function makeAdmin(overrides: Partial<LumaCalendarAdmin> = {}): LumaCalendarAdmin {
  return {
    id: "usr-test-123",
    api_id: "usr-test-123",
    name: "Test Admin",
    avatar_url: "https://example.com/avatar.png",
    email: "admin@example.com",
    first_name: "Test",
    last_name: "Admin",
    ...overrides,
  };
}

export function makeCoupon(overrides: Partial<LumaCoupon> = {}): LumaCoupon {
  return {
    id: "cpn-test-123",
    api_id: "cpn-test-123",
    code: "TESTCODE",
    remaining_count: 100,
    valid_start_at: null,
    valid_end_at: null,
    percent_off: null,
    cents_off: null,
    currency: null,
    ...overrides,
  };
}

export function makeEventTag(overrides: Partial<LumaEventTag> = {}): LumaEventTag {
  return {
    id: "tag-test-123",
    api_id: "tag-test-123",
    name: "Test Tag",
    color: "blue",
    ...overrides,
  };
}

export function makeContact(overrides: Partial<LumaContact> = {}): LumaContact {
  return {
    id: "ct-test-123",
    user_id: "usr-test-123",
    created_at: "2024-06-01T00:00:00.000Z",
    event_approved_count: 0,
    event_checked_in_count: 0,
    revenue_usd_cents: 0,
    tags: [],
    membership: null,
    name: "Test Contact",
    avatar_url: "https://example.com/avatar.png",
    email: "contact@example.com",
    first_name: "Test",
    last_name: "Contact",
    ...overrides,
  };
}

export function makeContactTag(overrides: Partial<LumaContactTag> = {}): LumaContactTag {
  return {
    id: "tag-test-123",
    name: "Test Tag",
    color: "blue",
    ...overrides,
  };
}

export function makeMembershipTier(overrides: Partial<LumaMembershipTier> = {}): LumaMembershipTier {
  return {
    id: "mst-test-123",
    name: "Test Tier",
    description: null,
    tint_color: "#3b82f6",
    access_info: { type: "free", require_approval: false },
    ...overrides,
  };
}

export interface MockCalendarEvent {
  id: string;
  api_id: string;
  status: string;
  event_id: string;
}

export function createMockLumaService(): LumaService & {
  events: Map<string, LumaEvent>;
  cancellationTokens: Map<string, string>;
  guests: Map<string, LumaGuest[]>;
  hosts: Map<string, MockHost[]>;
  ticketTypes: Map<string, LumaTicketType[]>;
  calendar: LumaCalendar;
  calendarAdmins: LumaCalendarAdmin[];
  calendarCoupons: LumaCoupon[];
  eventTags: LumaEventTag[];
  calendarEvents: MockCalendarEvent[];
  contacts: LumaContact[];
  contactTags: LumaContactTag[];
  membershipTiers: LumaMembershipTier[];
  members: Map<string, { membership_id: string; status: string; tier_id: string; user_id: string }>;
  lastAddGuestsParams: AddGuestsParams | null;
  lastSendInvitesParams: SendInvitesParams | null;
  lastRejectEventParams: RejectEventParams | null;
  lastImportContactsParams: ImportContactsParams | null;
  lastAddMemberParams: AddMemberParams | null;
  lastUpdateMemberStatusParams: UpdateMemberStatusParams | null;
} {
  const events = new Map<string, LumaEvent>();
  const cancellationTokens = new Map<string, string>();
  const guests = new Map<string, LumaGuest[]>();
  const hosts = new Map<string, MockHost[]>();
  const ticketTypes = new Map<string, LumaTicketType[]>();

  return {
    events,
    cancellationTokens,
    guests,
    hosts,
    ticketTypes,
    calendar: makeCalendar(),
    calendarAdmins: [],
    calendarCoupons: [],
    eventTags: [],
    calendarEvents: [],
    contacts: [],
    contactTags: [],
    membershipTiers: [],
    members: new Map(),
    lastAddGuestsParams: null,
    lastSendInvitesParams: null,
    lastRejectEventParams: null,
    lastImportContactsParams: null,
    lastAddMemberParams: null,
    lastUpdateMemberStatusParams: null,

    async listEvents(params?: ListEventsParams) {
      let entries = Array.from(events.values()).map((event) => ({ event }));

      if (params?.after) {
        entries = entries.filter((e) => e.event.start_at >= params.after!);
      }
      if (params?.before) {
        entries = entries.filter((e) => e.event.start_at <= params.before!);
      }

      const limit = params?.paginationLimit ?? 50;
      const startIndex = params?.paginationCursor
        ? parseInt(params.paginationCursor, 10)
        : 0;
      const page = entries.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < entries.length;

      return {
        entries: page,
        has_more: hasMore,
        next_cursor: hasMore ? String(startIndex + limit) : null,
      };
    },

    async getEvent(id: string) {
      const event = events.get(id);
      if (!event) {
        throw new Error(`Luma API error 404: Event not found`);
      }
      return { event };
    },

    async createEvent(params: CreateEventParams) {
      const event = makeEvent({
        api_id: `evt-${Date.now()}`,
        name: params.name,
        start_at: params.start_at,
        timezone: params.timezone,
        end_at: params.end_at ?? null,
        description: params.description_md ?? null,
        cover_url: params.cover_url ?? null,
        meeting_url: params.meeting_url ?? null,
        visibility: params.visibility ?? "public",
      });
      events.set(event.api_id, event);
      return { event };
    },

    async updateEvent(params: UpdateEventParams) {
      const event = events.get(params.event_id);
      if (!event) {
        throw new Error(`Luma API error 404: Event not found`);
      }
      if (params.name !== undefined) event.name = params.name;
      if (params.start_at !== undefined) event.start_at = params.start_at;
      if (params.timezone !== undefined) event.timezone = params.timezone;
      if (params.end_at !== undefined) event.end_at = params.end_at;
      if (params.description_md !== undefined) event.description = params.description_md;
      if (params.visibility !== undefined) event.visibility = params.visibility;
      events.set(event.api_id, event);
      return { event };
    },

    async requestCancellation(eventId: string) {
      const event = events.get(eventId);
      if (!event) {
        throw new Error(`Luma API error 404: Event not found`);
      }
      const token = `cancel-token-${Date.now()}`;
      cancellationTokens.set(eventId, token);
      return { cancellation_token: token };
    },

    async cancelEvent(eventId: string, cancellationToken: string) {
      const storedToken = cancellationTokens.get(eventId);
      if (!storedToken || storedToken !== cancellationToken) {
        throw new Error(`Luma API error 400: Invalid cancellation token`);
      }
      events.delete(eventId);
      cancellationTokens.delete(eventId);
    },

    async listGuests(params: ListGuestsParams) {
      let entries = guests.get(params.eventId) ?? [];

      if (params.approvalStatus) {
        entries = entries.filter((g) => g.approval_status === params.approvalStatus);
      }

      const limit = params.paginationLimit ?? 50;
      const startIndex = params.paginationCursor ? parseInt(params.paginationCursor, 10) : 0;
      const page = entries.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < entries.length;

      return {
        entries: page,
        has_more: hasMore,
        next_cursor: hasMore ? String(startIndex + limit) : null,
      };
    },

    async getGuest(eventId: string, id: string) {
      const eventGuests = guests.get(eventId) ?? [];
      const guest = eventGuests.find((g) => g.id === id || g.user_email === id);
      if (!guest) {
        throw new Error(`Luma API error 404: Guest not found`);
      }
      return guest;
    },

    async addGuests(params: AddGuestsParams) {
      this.lastAddGuestsParams = params;
      const eventGuests = guests.get(params.event_id) ?? [];
      for (const g of params.guests) {
        eventGuests.push(
          makeGuest({
            id: `gst-${Date.now()}-${Math.random()}`,
            user_email: g.email,
            user_name: g.name ?? null,
            approval_status: params.approval_status ?? "approved",
          })
        );
      }
      guests.set(params.event_id, eventGuests);
    },

    async updateGuestStatus(params: UpdateGuestStatusParams) {
      const eventGuests = guests.get(params.event_id) ?? [];
      const guest = eventGuests.find((g) => {
        if (params.guest.type === "email") return g.user_email === params.guest.email;
        return g.id === params.guest.api_id;
      });
      if (!guest) {
        throw new Error(`Luma API error 404: Guest not found`);
      }
      guest.approval_status = params.status;
    },

    async sendInvites(params: SendInvitesParams) {
      this.lastSendInvitesParams = params;
      const eventGuests = guests.get(params.event_id) ?? [];
      for (const g of params.guests) {
        const existing = eventGuests.find((eg) => eg.user_email === g.email);
        if (existing) {
          existing.approval_status = "invited";
        } else {
          eventGuests.push(
            makeGuest({
              id: `gst-${Date.now()}-${Math.random()}`,
              user_email: g.email,
              user_name: g.name ?? null,
              approval_status: "invited",
              invited_at: new Date().toISOString(),
            })
          );
        }
      }
      guests.set(params.event_id, eventGuests);
    },

    async createHost(params: CreateHostParams) {
      const eventHosts = hosts.get(params.event_id) ?? [];
      eventHosts.push({
        event_id: params.event_id,
        email: params.email,
        access_level: params.access_level ?? "manager",
        is_visible: params.is_visible ?? true,
        name: params.name ?? null,
        is_creator: false,
      });
      hosts.set(params.event_id, eventHosts);
    },

    async updateHost(params: UpdateHostParams) {
      const eventHosts = hosts.get(params.event_id) ?? [];
      const host = eventHosts.find((h) => h.email === params.email);
      if (!host) {
        throw new Error(`Luma API error 404: Host not found`);
      }
      if (host.is_creator) {
        throw new Error(`Luma API error 400: Cannot modify event creator`);
      }
      if (params.access_level !== undefined) host.access_level = params.access_level;
      if (params.is_visible !== undefined) host.is_visible = params.is_visible;
    },

    async removeHost(params: RemoveHostParams) {
      const eventHosts = hosts.get(params.event_id) ?? [];
      const host = eventHosts.find((h) => h.email === params.email);
      if (!host) {
        throw new Error(`Luma API error 404: Host not found`);
      }
      if (host.is_creator) {
        throw new Error(`Luma API error 400: Cannot remove event creator`);
      }
      hosts.set(
        params.event_id,
        eventHosts.filter((h) => h.email !== params.email)
      );
    },

    async listTicketTypes(params: ListTicketTypesParams) {
      let entries = ticketTypes.get(params.eventId) ?? [];
      if (!params.includeHidden) {
        entries = entries.filter((t) => !t.is_hidden);
      }
      return { entries };
    },

    async getTicketType(id: string) {
      for (const types of ticketTypes.values()) {
        const found = types.find((t) => t.id === id);
        if (found) return found;
      }
      throw new Error(`Luma API error 404: Ticket type not found`);
    },

    async createTicketType(params: CreateTicketTypeParams) {
      const tt = makeTicketType({
        id: `ett-${Date.now()}`,
        name: params.name,
        type: params.type,
        require_approval: params.require_approval ?? false,
        is_hidden: params.is_hidden ?? false,
        description: params.description ?? null,
        valid_start_at: params.valid_start_at ?? null,
        valid_end_at: params.valid_end_at ?? null,
        max_capacity: params.max_capacity ?? null,
        cents: params.cents ?? null,
        currency: params.currency ?? null,
        is_flexible: params.is_flexible ?? false,
        min_cents: params.min_cents ?? null,
      });
      const existing = ticketTypes.get(params.event_id) ?? [];
      existing.push(tt);
      ticketTypes.set(params.event_id, existing);
      return tt;
    },

    async updateTicketType(params: UpdateTicketTypeParams) {
      for (const types of ticketTypes.values()) {
        const tt = types.find((t) => t.id === params.event_ticket_type_id);
        if (tt) {
          if (params.name !== undefined) tt.name = params.name;
          if (params.type !== undefined) tt.type = params.type;
          if (params.require_approval !== undefined) tt.require_approval = params.require_approval;
          if (params.is_hidden !== undefined) tt.is_hidden = params.is_hidden;
          if (params.description !== undefined) tt.description = params.description ?? null;
          if (params.max_capacity !== undefined) tt.max_capacity = params.max_capacity ?? null;
          if (params.cents !== undefined) tt.cents = params.cents ?? null;
          if (params.currency !== undefined) tt.currency = params.currency ?? null;
          if (params.valid_start_at !== undefined) tt.valid_start_at = params.valid_start_at ?? null;
          if (params.valid_end_at !== undefined) tt.valid_end_at = params.valid_end_at ?? null;
          if (params.is_flexible !== undefined) tt.is_flexible = params.is_flexible;
          if (params.min_cents !== undefined) tt.min_cents = params.min_cents ?? null;
          return tt;
        }
      }
      throw new Error(`Luma API error 404: Ticket type not found`);
    },

    async deleteTicketType(params: DeleteTicketTypeParams) {
      for (const [eventId, types] of ticketTypes.entries()) {
        const idx = types.findIndex((t) => t.id === params.event_ticket_type_id);
        if (idx !== -1) {
          const tt = types[idx];
          if ((tt as LumaTicketType & { has_sold_tickets?: boolean }).has_sold_tickets) {
            throw new Error(`Luma API error 400: Cannot delete ticket type with sold tickets`);
          }
          types.splice(idx, 1);
          ticketTypes.set(eventId, types);
          return;
        }
      }
      throw new Error(`Luma API error 404: Ticket type not found`);
    },

    async getCalendar() {
      return this.calendar;
    },

    async lookupEvent(params: LookupEventParams) {
      const entry = this.calendarEvents.find((ce) => {
        if (params.event_id) return ce.event_id === params.event_id;
        return false;
      });
      return { event: entry ? { id: entry.id, api_id: entry.api_id, status: entry.status } : null };
    },

    async addEventToCalendar(params: AddEventLumaParams | AddEventExternalParams) {
      const id = `calev-${Date.now()}`;
      const eventId = params.platform === "luma" ? params.event_id : `evt-ext-${Date.now()}`;
      const status = params.submission_mode === "pending" ? "pending" : "approved";
      const entry: MockCalendarEvent = { id, api_id: id, status, event_id: eventId };
      this.calendarEvents.push(entry);
      return { id: entry.id, api_id: entry.api_id, status: entry.status };
    },

    async approveEvent(calendarEventId: string) {
      const entry = this.calendarEvents.find((ce) => ce.id === calendarEventId || ce.event_id === calendarEventId);
      if (!entry) throw new Error(`Luma API error 404: Calendar event not found`);
      entry.status = "approved";
    },

    async rejectEvent(params: RejectEventParams) {
      this.lastRejectEventParams = params;
      const entry = this.calendarEvents.find((ce) => ce.id === params.calendar_event_id || ce.event_id === params.calendar_event_id);
      if (!entry) throw new Error(`Luma API error 404: Calendar event not found`);
      entry.status = "rejected";
    },

    async listAdmins() {
      return { entries: this.calendarAdmins };
    },

    async listCoupons(params?: ListCouponsParams) {
      const limit = params?.paginationLimit ?? 50;
      const startIndex = params?.paginationCursor ? parseInt(params.paginationCursor, 10) : 0;
      const page = this.calendarCoupons.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < this.calendarCoupons.length;
      return {
        entries: page,
        has_more: hasMore,
        next_cursor: hasMore ? String(startIndex + limit) : null,
      };
    },

    async createCoupon(params: CreateCouponParams) {
      const coupon = makeCoupon({
        id: `cpn-${Date.now()}`,
        code: params.code,
        remaining_count: params.remaining_count ?? 1000000,
        valid_start_at: params.valid_start_at ?? null,
        valid_end_at: params.valid_end_at ?? null,
        percent_off: params.discount.discount_type === "percent" ? params.discount.percent_off : null,
        cents_off: params.discount.discount_type === "amount" ? params.discount.cents_off : null,
        currency: params.discount.discount_type === "amount" ? params.discount.currency : null,
      });
      this.calendarCoupons.push(coupon);
      return coupon;
    },

    async updateCoupon(params: UpdateCouponParams) {
      const coupon = this.calendarCoupons.find((c) => c.code === params.code);
      if (!coupon) throw new Error(`Luma API error 404: Coupon not found`);
      if (params.remaining_count !== undefined) coupon.remaining_count = params.remaining_count;
      if (params.valid_start_at !== undefined) coupon.valid_start_at = params.valid_start_at ?? null;
      if (params.valid_end_at !== undefined) coupon.valid_end_at = params.valid_end_at ?? null;
    },

    async listEventTags() {
      return { entries: this.eventTags };
    },

    async createEventTag(params: CreateEventTagParams) {
      const id = `tag-${Date.now()}`;
      const tag = makeEventTag({
        id,
        api_id: id,
        name: params.name,
        color: params.color ?? "blue",
      });
      this.eventTags.push(tag);
      return { tag_id: tag.id, tag_api_id: tag.api_id };
    },

    async updateEventTag(params: UpdateEventTagParams) {
      const tag = this.eventTags.find((t) => t.id === params.tag_id);
      if (!tag) throw new Error(`Luma API error 404: Event tag not found`);
      if (params.name !== undefined) tag.name = params.name;
      if (params.color !== undefined) tag.color = params.color;
    },

    async deleteEventTag(tagId: string) {
      const idx = this.eventTags.findIndex((t) => t.id === tagId);
      if (idx === -1) throw new Error(`Luma API error 404: Event tag not found`);
      this.eventTags.splice(idx, 1);
    },

    async applyEventTag(params: ApplyEventTagParams) {
      const tag = this.eventTags.find((t) => t.id === params.tag || t.name === params.tag);
      if (!tag) throw new Error(`Luma API error 404: Event tag not found`);
      const eventIds = params.event_ids ?? [];
      let applied = 0;
      let skipped = 0;
      for (const eid of eventIds) {
        if (events.has(eid)) {
          applied++;
        } else {
          skipped++;
        }
      }
      return { applied_count: applied, skipped_count: skipped };
    },

    async unapplyEventTag(params: UnapplyEventTagParams) {
      const tag = this.eventTags.find((t) => t.id === params.tag || t.name === params.tag);
      if (!tag) throw new Error(`Luma API error 404: Event tag not found`);
      const eventIds = params.event_ids ?? [];
      let removed = 0;
      let skipped = 0;
      for (const eid of eventIds) {
        if (events.has(eid)) {
          removed++;
        } else {
          skipped++;
        }
      }
      return { removed_count: removed, skipped_count: skipped };
    },

    async listContacts(params?: ListContactsParams) {
      let entries = [...this.contacts];

      if (params?.query) {
        const q = params.query.toLowerCase();
        entries = entries.filter(
          (c) =>
            (c.name && c.name.toLowerCase().includes(q)) ||
            c.email.toLowerCase().includes(q)
        );
      }
      if (params?.tags && params.tags.length > 0) {
        entries = entries.filter((c) =>
          c.tags.some((t) => params.tags!.includes(t.id) || params.tags!.includes(t.name))
        );
      }

      const limit = params?.paginationLimit ?? 50;
      const startIndex = params?.paginationCursor ? parseInt(params.paginationCursor, 10) : 0;
      const page = entries.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < entries.length;

      return {
        entries: page,
        has_more: hasMore,
        next_cursor: hasMore ? String(startIndex + limit) : null,
      };
    },

    async importContacts(params: ImportContactsParams) {
      this.lastImportContactsParams = params;
      for (const c of params.contacts) {
        this.contacts.push(
          makeContact({
            id: `ct-${this.contacts.length + 1}`,
            email: c.email,
            name: c.name ?? null,
          })
        );
      }
    },

    async listContactTags() {
      return { entries: this.contactTags };
    },

    async createContactTag(params: CreateContactTagParams) {
      const id = `tag-${this.contactTags.length + 1}`;
      const tag = makeContactTag({
        id,
        name: params.name,
        color: params.color ?? "blue",
      });
      this.contactTags.push(tag);
      return { id };
    },

    async applyContactTag(params: ApplyContactTagParams) {
      const tag = this.contactTags.find((t) => t.id === params.tag || t.name === params.tag);
      if (!tag) throw new Error(`Luma API error 404: Contact tag not found`);
      const emails = params.emails ?? [];
      const userIds = params.user_ids ?? [];
      let applied = 0;
      let skipped = 0;
      for (const email of emails) {
        const contact = this.contacts.find((c) => c.email === email);
        if (contact) {
          applied++;
        } else {
          skipped++;
        }
      }
      for (const uid of userIds) {
        const contact = this.contacts.find((c) => c.user_id === uid);
        if (contact) {
          applied++;
        } else {
          skipped++;
        }
      }
      return { applied_count: applied, skipped_count: skipped };
    },

    async unapplyContactTag(params: UnapplyContactTagParams) {
      const tag = this.contactTags.find((t) => t.id === params.tag || t.name === params.tag);
      if (!tag) throw new Error(`Luma API error 404: Contact tag not found`);
      const emails = params.emails ?? [];
      const userIds = params.user_ids ?? [];
      let removed = 0;
      let skipped = 0;
      for (const email of emails) {
        const contact = this.contacts.find((c) => c.email === email);
        if (contact) {
          removed++;
        } else {
          skipped++;
        }
      }
      for (const uid of userIds) {
        const contact = this.contacts.find((c) => c.user_id === uid);
        if (contact) {
          removed++;
        } else {
          skipped++;
        }
      }
      return { removed_count: removed, skipped_count: skipped };
    },

    async updateContactTag(params: UpdateContactTagParams) {
      const tag = this.contactTags.find((t) => t.id === params.tag_id);
      if (!tag) throw new Error(`Luma API error 404: Contact tag not found`);
      if (params.name !== undefined) tag.name = params.name;
      if (params.color !== undefined) tag.color = params.color;
    },

    async deleteContactTag(tagId: string) {
      const idx = this.contactTags.findIndex((t) => t.id === tagId);
      if (idx === -1) throw new Error(`Luma API error 404: Contact tag not found`);
      this.contactTags.splice(idx, 1);
    },

    async listMembershipTiers(params?: ListMembershipTiersParams) {
      const limit = params?.paginationLimit ?? 50;
      const startIndex = params?.paginationCursor ? parseInt(params.paginationCursor, 10) : 0;
      const page = this.membershipTiers.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < this.membershipTiers.length;
      return {
        entries: page,
        has_more: hasMore,
        next_cursor: hasMore ? String(startIndex + limit) : null,
      };
    },

    async addMember(params: AddMemberParams) {
      this.lastAddMemberParams = params;
      const tier = this.membershipTiers.find((t) => t.id === params.membership_tier_id);
      if (!tier) throw new Error(`Luma API error 404: Membership tier not found`);
      const membershipId = `mem-${this.members.size + 1}`;
      const status = "approved";
      this.members.set(params.email, { membership_id: membershipId, status, tier_id: params.membership_tier_id, user_id: params.email });
      return { membership_id: membershipId, status };
    },

    async updateMemberStatus(params: UpdateMemberStatusParams) {
      this.lastUpdateMemberStatusParams = params;
      const member = this.members.get(params.user_id);
      if (!member) throw new Error(`Luma API error 404: Member not found`);
      member.status = params.status;
    },
  };
}

function applyExitOverride(cmd: import("commander").Command): void {
  cmd.exitOverride();
  for (const sub of cmd.commands) {
    applyExitOverride(sub);
  }
}

export async function runCommand(
  luma: LumaService,
  args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const out = createTestOutput();
  const program = createProgram(luma, out);
  applyExitOverride(program);

  try {
    await program.parseAsync(["node", "nori-luma", ...args]);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "exitCode" in err &&
      typeof (err as Record<string, unknown>).exitCode === "number"
    ) {
      out.exitCode = (err as { exitCode: number }).exitCode;
    } else {
      out.error(String(err) + "\n");
      out.exitCode = 1;
    }
  }

  return { stdout: out.stdout, stderr: out.stderr, exitCode: out.exitCode };
}
