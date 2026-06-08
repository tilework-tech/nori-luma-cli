import { createProgram } from "../src/program.js";
import type { Output } from "../src/output.js";
import type {
  LumaService,
  LumaEvent,
  CreateEventParams,
  UpdateEventParams,
  ListEventsParams,
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

export function createMockLumaService(): LumaService & {
  events: Map<string, LumaEvent>;
  cancellationTokens: Map<string, string>;
} {
  const events = new Map<string, LumaEvent>();
  const cancellationTokens = new Map<string, string>();

  return {
    events,
    cancellationTokens,

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
