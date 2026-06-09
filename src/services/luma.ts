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

export interface LumaGuest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  user_first_name: string | null;
  user_last_name: string | null;
  approval_status: string;
  check_in_qr_code: string | null;
  registered_at: string | null;
  invited_at: string | null;
  joined_at: string | null;
  phone_number: string | null;
  utm_source: string | null;
  event_tickets: unknown[];
}

export interface ListGuestsParams {
  eventId: string;
  approvalStatus?: string;
  paginationLimit?: number;
  paginationCursor?: string;
  sortColumn?: string;
  sortDirection?: string;
}

export interface AddGuestsParams {
  event_id: string;
  guests: { email: string; name?: string }[];
  approval_status?: string;
  send_email?: boolean;
}

export interface GuestIdentifier {
  type: "email" | "api_id";
  email?: string;
  api_id?: string;
}

export interface UpdateGuestStatusParams {
  event_id: string;
  guest: GuestIdentifier;
  status: string;
  should_refund?: boolean;
  send_email?: boolean;
}

export interface SendInvitesParams {
  event_id: string;
  guests: { email: string; name?: string }[];
  message?: string;
}

export interface CreateHostParams {
  event_id: string;
  email: string;
  access_level?: string;
  is_visible?: boolean;
  name?: string;
}

export interface UpdateHostParams {
  event_id: string;
  email: string;
  access_level?: string;
  is_visible?: boolean;
}

export interface RemoveHostParams {
  event_id: string;
  email: string;
}

export interface LumaTicketType {
  id: string;
  name: string;
  type: string;
  require_approval: boolean;
  is_hidden: boolean;
  description: string | null;
  valid_start_at: string | null;
  valid_end_at: string | null;
  max_capacity: number | null;
  cents: number | null;
  currency: string | null;
  is_flexible: boolean;
  min_cents: number | null;
}

export interface ListTicketTypesParams {
  eventId: string;
  includeHidden?: boolean;
}

export interface CreateTicketTypeParams {
  event_id: string;
  name: string;
  type: string;
  require_approval?: boolean;
  is_hidden?: boolean;
  description?: string;
  valid_start_at?: string;
  valid_end_at?: string;
  max_capacity?: number;
  cents?: number;
  currency?: string;
  is_flexible?: boolean;
  min_cents?: number;
}

export interface UpdateTicketTypeParams {
  event_ticket_type_id: string;
  name?: string;
  type?: string;
  require_approval?: boolean;
  is_hidden?: boolean;
  description?: string;
  valid_start_at?: string;
  valid_end_at?: string;
  max_capacity?: number;
  cents?: number;
  currency?: string;
  is_flexible?: boolean;
  min_cents?: number;
}

export interface DeleteTicketTypeParams {
  event_ticket_type_id: string;
}

export interface LumaCalendar {
  id: string;
  name: string;
  slug: string | null;
  avatar_url: string | null;
  url: string;
  description: string | null;
  social_image_url: string | null;
  cover_image_url: string | null;
  is_personal: boolean;
  location: {
    city: string;
    region: string | null;
    country: string | null;
    country_code: string | null;
    timezone: string;
  } | null;
  coordinate: { longitude: number; latitude: number } | null;
  instagram_handle: string | null;
  twitter_handle: string | null;
  youtube_handle: string | null;
  website: string | null;
}

export interface CalendarEventEntry {
  id: string;
  api_id: string;
  status: string;
}

export interface LookupEventParams {
  platform?: string;
  url?: string;
  event_id?: string;
}

export interface AddEventLumaParams {
  platform: "luma";
  event_id: string;
  submission_mode?: string;
}

export interface AddEventExternalParams {
  platform: "external";
  url: string;
  name: string;
  start_at: string;
  duration_interval: string;
  timezone: string;
  submission_mode?: string;
  host?: string;
}

export interface RejectEventParams {
  calendar_event_id: string;
  message?: string;
}

export interface LumaCalendarAdmin {
  id: string;
  api_id: string;
  name: string | null;
  avatar_url: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface LumaCoupon {
  id: string;
  api_id: string;
  code: string;
  remaining_count: number;
  valid_start_at: string | null;
  valid_end_at: string | null;
  percent_off: number | null;
  cents_off: number | null;
  currency: string | null;
  event_ticket_type_id?: string | null;
}

export interface ListCouponsParams {
  paginationCursor?: string;
  paginationLimit?: number;
}

export interface CreateCouponParams {
  code: string;
  discount: { discount_type: "percent"; percent_off: number } | { discount_type: "amount"; cents_off: number; currency: string };
  remaining_count?: number;
  valid_start_at?: string;
  valid_end_at?: string;
}

export interface UpdateCouponParams {
  code: string;
  remaining_count?: number;
  valid_start_at?: string | null;
  valid_end_at?: string | null;
}

export interface LumaEventTag {
  id: string;
  api_id: string;
  name: string;
  color: string;
}

export interface CreateEventTagParams {
  name: string;
  color?: string | null;
}

export interface UpdateEventTagParams {
  tag_id: string;
  name?: string;
  color?: string;
}

export interface ApplyEventTagParams {
  tag: string;
  event_ids?: string[];
}

export interface UnapplyEventTagParams {
  tag: string;
  event_ids?: string[];
}

export interface LumaContact {
  id: string;
  user_id: string;
  created_at: string;
  event_approved_count: number;
  event_checked_in_count: number;
  revenue_usd_cents: number;
  tags: { id: string; name: string }[];
  membership: { status: string; calendar_membership_tier_id: string | null } | null;
  name: string | null;
  avatar_url: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface ListContactsParams {
  query?: string;
  tags?: string[];
  calendarMembershipTierId?: string;
  membershipStatus?: string;
  paginationCursor?: string;
  paginationLimit?: number;
  sortColumn?: string;
  sortDirection?: string;
}

export interface ImportContactsParams {
  contacts: { email: string; name?: string }[];
  tags?: string[];
}

export interface LumaContactTag {
  id: string;
  name: string;
  color: string;
}

export interface CreateContactTagParams {
  name: string;
  color?: string | null;
}

export interface UpdateContactTagParams {
  tag_id: string;
  name?: string;
  color?: string;
}

export interface ApplyContactTagParams {
  tag: string;
  user_ids?: string[];
  emails?: string[];
}

export interface UnapplyContactTagParams {
  tag: string;
  user_ids?: string[];
  emails?: string[];
}

export interface LumaService {
  listEvents(params?: ListEventsParams): Promise<PaginatedResponse<{ event: LumaEvent }>>;
  getEvent(id: string): Promise<{ event: LumaEvent }>;
  createEvent(params: CreateEventParams): Promise<{ event: LumaEvent }>;
  updateEvent(params: UpdateEventParams): Promise<{ event: LumaEvent }>;
  requestCancellation(eventId: string): Promise<CancelRequestResponse>;
  cancelEvent(eventId: string, cancellationToken: string): Promise<void>;
  listGuests(params: ListGuestsParams): Promise<PaginatedResponse<LumaGuest>>;
  getGuest(eventId: string, id: string): Promise<LumaGuest>;
  addGuests(params: AddGuestsParams): Promise<void>;
  updateGuestStatus(params: UpdateGuestStatusParams): Promise<void>;
  sendInvites(params: SendInvitesParams): Promise<void>;
  createHost(params: CreateHostParams): Promise<void>;
  updateHost(params: UpdateHostParams): Promise<void>;
  removeHost(params: RemoveHostParams): Promise<void>;
  listTicketTypes(params: ListTicketTypesParams): Promise<{ entries: LumaTicketType[] }>;
  getTicketType(id: string): Promise<LumaTicketType>;
  createTicketType(params: CreateTicketTypeParams): Promise<LumaTicketType>;
  updateTicketType(params: UpdateTicketTypeParams): Promise<LumaTicketType>;
  deleteTicketType(params: DeleteTicketTypeParams): Promise<void>;
  getCalendar(): Promise<LumaCalendar>;
  lookupEvent(params: LookupEventParams): Promise<{ event: CalendarEventEntry | null }>;
  addEventToCalendar(params: AddEventLumaParams | AddEventExternalParams): Promise<CalendarEventEntry>;
  approveEvent(calendarEventId: string): Promise<void>;
  rejectEvent(params: RejectEventParams): Promise<void>;
  listAdmins(): Promise<{ entries: LumaCalendarAdmin[] }>;
  listCoupons(params?: ListCouponsParams): Promise<PaginatedResponse<LumaCoupon>>;
  createCoupon(params: CreateCouponParams): Promise<LumaCoupon>;
  updateCoupon(params: UpdateCouponParams): Promise<void>;
  listEventTags(): Promise<{ entries: LumaEventTag[] }>;
  createEventTag(params: CreateEventTagParams): Promise<{ tag_id: string; tag_api_id: string }>;
  updateEventTag(params: UpdateEventTagParams): Promise<void>;
  deleteEventTag(tagId: string): Promise<void>;
  applyEventTag(params: ApplyEventTagParams): Promise<{ applied_count: number; skipped_count: number }>;
  unapplyEventTag(params: UnapplyEventTagParams): Promise<{ removed_count: number; skipped_count: number }>;
  listContacts(params?: ListContactsParams): Promise<PaginatedResponse<LumaContact>>;
  importContacts(params: ImportContactsParams): Promise<void>;
  listContactTags(): Promise<{ entries: LumaContactTag[] }>;
  createContactTag(params: CreateContactTagParams): Promise<{ id: string }>;
  applyContactTag(params: ApplyContactTagParams): Promise<{ applied_count: number; skipped_count: number }>;
  unapplyContactTag(params: UnapplyContactTagParams): Promise<{ removed_count: number; skipped_count: number }>;
  updateContactTag(params: UpdateContactTagParams): Promise<void>;
  deleteContactTag(tagId: string): Promise<void>;
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

    async listGuests(params: ListGuestsParams) {
      const query: Record<string, string> = { event_id: params.eventId };
      if (params.approvalStatus) query.approval_status = params.approvalStatus;
      if (params.paginationLimit) query.pagination_limit = String(params.paginationLimit);
      if (params.paginationCursor) query.pagination_cursor = params.paginationCursor;
      if (params.sortColumn) query.sort_column = params.sortColumn;
      if (params.sortDirection) query.sort_direction = params.sortDirection;
      return request<PaginatedResponse<LumaGuest>>("GET", "/v1/event/get-guests", undefined, query);
    },

    async getGuest(eventId: string, id: string) {
      return request<LumaGuest>("GET", "/v1/events/guests/get", undefined, { event_id: eventId, id });
    },

    async addGuests(params: AddGuestsParams) {
      await request<void>("POST", "/v1/event/add-guests", params as unknown as Record<string, unknown>);
    },

    async updateGuestStatus(params: UpdateGuestStatusParams) {
      await request<void>("POST", "/v1/event/update-guest-status", params as unknown as Record<string, unknown>);
    },

    async sendInvites(params: SendInvitesParams) {
      await request<void>("POST", "/v1/event/send-invites", params as unknown as Record<string, unknown>);
    },

    async createHost(params: CreateHostParams) {
      await request<void>("POST", "/v1/event/hosts/create", params as unknown as Record<string, unknown>);
    },

    async updateHost(params: UpdateHostParams) {
      await request<void>("POST", "/v1/event/hosts/update", params as unknown as Record<string, unknown>);
    },

    async removeHost(params: RemoveHostParams) {
      await request<void>("POST", "/v1/event/hosts/remove", params as unknown as Record<string, unknown>);
    },

    async listTicketTypes(params: ListTicketTypesParams) {
      const query: Record<string, string> = { event_id: params.eventId };
      if (params.includeHidden) query.include_hidden = "true";
      return request<{ entries: LumaTicketType[] }>("GET", "/v1/events/ticket-types/list", undefined, query);
    },

    async getTicketType(id: string) {
      return request<LumaTicketType>("GET", "/v1/events/ticket-types/get", undefined, { event_ticket_type_id: id });
    },

    async createTicketType(params: CreateTicketTypeParams) {
      return request<LumaTicketType>("POST", "/v1/events/ticket-types/create", params as unknown as Record<string, unknown>);
    },

    async updateTicketType(params: UpdateTicketTypeParams) {
      return request<LumaTicketType>("POST", "/v1/events/ticket-types/update", params as unknown as Record<string, unknown>);
    },

    async deleteTicketType(params: DeleteTicketTypeParams) {
      await request<void>("POST", "/v1/event/ticket-types/delete", params as unknown as Record<string, unknown>);
    },

    async getCalendar() {
      return request<LumaCalendar>("GET", "/v1/calendars/get");
    },

    async lookupEvent(params: LookupEventParams) {
      const query: Record<string, string> = {};
      if (params.platform) query.platform = params.platform;
      if (params.url) query.url = params.url;
      if (params.event_id) query.event_id = params.event_id;
      return request<{ event: CalendarEventEntry | null }>("GET", "/v1/calendar/lookup-event", undefined, query);
    },

    async addEventToCalendar(params: AddEventLumaParams | AddEventExternalParams) {
      return request<CalendarEventEntry>("POST", "/v1/calendar/add-event", params as unknown as Record<string, unknown>);
    },

    async approveEvent(calendarEventId: string) {
      await request<void>("POST", "/v1/calendar/approve-event", { calendar_event_id: calendarEventId });
    },

    async rejectEvent(params: RejectEventParams) {
      await request<void>("POST", "/v1/calendar/reject-event", params as unknown as Record<string, unknown>);
    },

    async listAdmins() {
      return request<{ entries: LumaCalendarAdmin[] }>("GET", "/v1/calendar/admins/list");
    },

    async listCoupons(params?: ListCouponsParams) {
      const query: Record<string, string> = {};
      if (params?.paginationLimit) query.pagination_limit = String(params.paginationLimit);
      if (params?.paginationCursor) query.pagination_cursor = params.paginationCursor;
      return request<PaginatedResponse<LumaCoupon>>("GET", "/v1/calendar/coupons", undefined, query);
    },

    async createCoupon(params: CreateCouponParams) {
      return request<LumaCoupon>("POST", "/v1/calendars/coupons/create", params as unknown as Record<string, unknown>);
    },

    async updateCoupon(params: UpdateCouponParams) {
      await request<void>("POST", "/v1/calendar/coupons/update", params as unknown as Record<string, unknown>);
    },

    async listEventTags() {
      return request<{ entries: LumaEventTag[] }>("GET", "/v1/calendar/event-tags/list");
    },

    async createEventTag(params: CreateEventTagParams) {
      return request<{ tag_id: string; tag_api_id: string }>("POST", "/v1/calendar/event-tags/create", params as unknown as Record<string, unknown>);
    },

    async updateEventTag(params: UpdateEventTagParams) {
      await request<void>("POST", "/v1/calendar/event-tags/update", params as unknown as Record<string, unknown>);
    },

    async deleteEventTag(tagId: string) {
      await request<void>("POST", "/v1/calendar/event-tags/delete", { tag_id: tagId });
    },

    async applyEventTag(params: ApplyEventTagParams) {
      return request<{ applied_count: number; skipped_count: number }>("POST", "/v1/calendar/event-tags/apply", params as unknown as Record<string, unknown>);
    },

    async unapplyEventTag(params: UnapplyEventTagParams) {
      return request<{ removed_count: number; skipped_count: number }>("POST", "/v1/calendar/event-tags/unapply", params as unknown as Record<string, unknown>);
    },

    async listContacts(params?: ListContactsParams) {
      const query: Record<string, string> = {};
      if (params?.query) query.query = params.query;
      if (params?.calendarMembershipTierId) query.calendar_membership_tier_id = params.calendarMembershipTierId;
      if (params?.membershipStatus) query.membership_status = params.membershipStatus;
      if (params?.paginationLimit) query.pagination_limit = String(params.paginationLimit);
      if (params?.paginationCursor) query.pagination_cursor = params.paginationCursor;
      if (params?.sortColumn) query.sort_column = params.sortColumn;
      if (params?.sortDirection) query.sort_direction = params.sortDirection;

      const url = new URL("/v1/calendars/contacts/list", baseUrl);
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
      if (params?.tags) {
        for (const tag of params.tags) {
          url.searchParams.append("tags", tag);
        }
      }

      const headers: Record<string, string> = {
        "x-luma-api-key": apiKey,
        Accept: "application/json",
      };

      const response = await fetch(url.toString(), { method: "GET", headers });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Luma API error ${response.status}: ${text}`);
      }

      const text = await response.text();
      if (!text) return { entries: [], has_more: false, next_cursor: null } as PaginatedResponse<LumaContact>;
      return JSON.parse(text) as PaginatedResponse<LumaContact>;
    },

    async importContacts(params: ImportContactsParams) {
      await request<void>("POST", "/v1/calendars/contacts/import", params as unknown as Record<string, unknown>);
    },

    async listContactTags() {
      return request<{ entries: LumaContactTag[] }>("GET", "/v1/calendars/contact-tags/list");
    },

    async createContactTag(params: CreateContactTagParams) {
      return request<{ id: string }>("POST", "/v1/calendars/contact-tags/create", params as unknown as Record<string, unknown>);
    },

    async applyContactTag(params: ApplyContactTagParams) {
      return request<{ applied_count: number; skipped_count: number }>("POST", "/v1/calendars/contact-tags/apply", params as unknown as Record<string, unknown>);
    },

    async unapplyContactTag(params: UnapplyContactTagParams) {
      return request<{ removed_count: number; skipped_count: number }>("POST", "/v1/calendars/contact-tags/unapply", params as unknown as Record<string, unknown>);
    },

    async updateContactTag(params: UpdateContactTagParams) {
      await request<void>("POST", "/v1/calendars/contact-tags/update", params as unknown as Record<string, unknown>);
    },

    async deleteContactTag(tagId: string) {
      await request<void>("POST", "/v1/calendars/contact-tags/delete", { tag_id: tagId });
    },
  };
}
