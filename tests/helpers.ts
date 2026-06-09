import { createProgram } from "../src/program.js";
import type { Output } from "../src/output.js";
import type {
  LumaService,
  LumaEvent,
  LumaGuest,
  LumaTicketType,
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

export function createMockLumaService(): LumaService & {
  events: Map<string, LumaEvent>;
  cancellationTokens: Map<string, string>;
  guests: Map<string, LumaGuest[]>;
  hosts: Map<string, MockHost[]>;
  ticketTypes: Map<string, LumaTicketType[]>;
  lastAddGuestsParams: AddGuestsParams | null;
  lastSendInvitesParams: SendInvitesParams | null;
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
    lastAddGuestsParams: null,
    lastSendInvitesParams: null,

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
