# nori-luma-cli

CLI for the [Luma](https://lu.ma) event platform API. Covers all 61 API endpoints across 10 command groups. Designed for agentic use — all output is JSON, all parameters are flags, no interactivity.

## Setup

```bash
npm install
export LUMA_API_KEY=your-key-here
```

Get your API key from: Luma App → Calendars Home → Settings → Developer → API Keys.

## Usage

```bash
npx tsx src/index.ts <command> [subcommand] [options]
```

Or after building:

```bash
npm run build
nori-luma <command> [subcommand] [options]
```

## Commands

| Command | Subcommands | Description |
|---------|------------|-------------|
| `events` | list, get, create, update, cancel, list-coupons, create-coupon, update-coupon | Manage events and event-scoped coupons |
| `guests` | list, get, add, update-status, send-invites | Manage event guests and invitations |
| `hosts` | add, update, remove | Manage event hosts |
| `ticket-types` | list, get, create, update, delete | Manage event ticket types |
| `calendar` | get, lookup-event, add-event, approve-event, reject-event, list-admins, list-coupons, create-coupon, update-coupon, list-event-tags, create-event-tag, update-event-tag, delete-event-tag, apply-event-tag, unapply-event-tag | Calendar settings, admins, coupons, event tags |
| `contacts` | list, import, list-contact-tags, create-contact-tag, apply-contact-tag, unapply-contact-tag, update-contact-tag, delete-contact-tag | Manage contacts and contact tags |
| `membership` | list-tiers, add-member, update-member-status | Manage membership tiers and members |
| `organization` | list-admins, list-calendars, list-events, transfer-event, create-calendar | Organization-level management (requires org-scoped API key) |
| `webhook` | list, get, create, update, delete | Manage webhook endpoints |
| `utility` | get-self, entity-lookup, image-upload | Account info, slug lookup, image uploads |

Use `--help` on any command or subcommand for detailed usage:

```bash
npx tsx src/index.ts events --help
npx tsx src/index.ts events create --help
```

## Examples

```bash
# List upcoming events
npx tsx src/index.ts events list --after 2024-01-01T00:00:00Z

# Create an event
npx tsx src/index.ts events create \
  --name "Meetup" \
  --start-at "2024-07-01T18:00:00Z" \
  --timezone "America/New_York" \
  --visibility public

# Get guest list
npx tsx src/index.ts guests list --event-id evt-xxx

# Look up a lu.ma slug
npx tsx src/index.ts utility entity-lookup --slug my-community
```

## Testing

```bash
npm test
```

283 tests across 12 test files covering all command groups, parse utilities, and program-level behavior.

## License

MIT
