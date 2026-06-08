export interface PaginatedResponse<T> {
  entries: T[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface LumaEvent {
  api_id: string;
  name: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  timezone: string;
  cover_url: string | null;
  url: string | null;
  visibility: string | null;
  meeting_url: string | null;
  geo_address_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ListEventsParams {
  after?: string;
  before?: string;
  paginationLimit?: number;
  paginationCursor?: string;
}

export interface CreateEventParams {
  name: string;
  start_at: string;
  timezone: string;
  end_at?: string;
  description_md?: string;
  cover_url?: string;
  meeting_url?: string;
  geo_address_json?: Record<string, unknown>;
  max_capacity?: number;
  visibility?: string;
  slug?: string;
}

export interface UpdateEventParams {
  event_id: string;
  name?: string;
  start_at?: string;
  timezone?: string;
  end_at?: string;
  description_md?: string;
  cover_url?: string;
  meeting_url?: string;
  geo_address_json?: Record<string, unknown>;
  max_capacity?: number;
  visibility?: string;
  slug?: string;
  suppress_notifications?: boolean;
}

export interface CancelRequestResponse {
  cancellation_token: string;
}

export interface LumaService {
  listEvents(params?: ListEventsParams): Promise<PaginatedResponse<{ event: LumaEvent }>>;
  getEvent(id: string): Promise<{ event: LumaEvent }>;
  createEvent(params: CreateEventParams): Promise<{ event: LumaEvent }>;
  updateEvent(params: UpdateEventParams): Promise<{ event: LumaEvent }>;
  requestCancellation(eventId: string): Promise<CancelRequestResponse>;
  cancelEvent(eventId: string, cancellationToken: string): Promise<void>;
}

export function createLumaService(apiKey: string): LumaService {
  const baseUrl = "https://public-api.luma.com";

  async function request<T>(method: string, path: string, body?: Record<string, unknown>, query?: Record<string, string>): Promise<T> {
    const url = new URL(path, baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      "x-luma-api-key": apiKey,
      Accept: "application/json",
    };
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Luma API error ${response.status}: ${text}`);
    }

    const text = await response.text();
    if (!text) return undefined as unknown as T;
    return JSON.parse(text) as T;
  }

  return {
    async listEvents(params?: ListEventsParams) {
      const query: Record<string, string> = {};
      if (params?.after) query.after = params.after;
      if (params?.before) query.before = params.before;
      if (params?.paginationLimit) query.pagination_limit = String(params.paginationLimit);
      if (params?.paginationCursor) query.pagination_cursor = params.paginationCursor;
      return request<PaginatedResponse<{ event: LumaEvent }>>("GET", "/v1/calendar/list-events", undefined, query);
    },

    async getEvent(id: string) {
      return request<{ event: LumaEvent }>("GET", "/v1/event/get", undefined, { id });
    },

    async createEvent(params: CreateEventParams) {
      return request<{ event: LumaEvent }>("POST", "/v1/event/create", params as unknown as Record<string, unknown>);
    },

    async updateEvent(params: UpdateEventParams) {
      return request<{ event: LumaEvent }>("POST", "/v1/event/update", params as unknown as Record<string, unknown>);
    },

    async requestCancellation(eventId: string) {
      return request<CancelRequestResponse>("POST", "/v1/event/cancel/request", { event_id: eventId });
    },

    async cancelEvent(eventId: string, cancellationToken: string) {
      await request<void>("POST", "/v1/event/cancel", {
        event_id: eventId,
        cancellation_token: cancellationToken,
      });
    },
  };
}
