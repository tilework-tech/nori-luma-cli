# Current Progress

## Status: In Progress — Adding Command Groups

## Completed
- Project scaffolding (package.json, tsconfig, vitest, ESM setup)
- Core infrastructure (Output abstraction, LumaService interface, config loader, program shell)
- Events command group (list, get, create, update, cancel) with 25 passing tests
- Guest command group (list, get, add, update-status, send-invites) with 27 passing tests
- Host command group (add, update, remove) with 16 passing tests
- Ticket type command group (list, get, create, update, delete) with 21 passing tests
- Calendar command group (get, lookup-event, add-event, approve-event, reject-event, list-admins, list-coupons, create-coupon, update-coupon, list-event-tags, create-event-tag, update-event-tag, delete-event-tag, apply-event-tag, unapply-event-tag) with 45 passing tests
- Contact command group (list, import, list-contact-tags, create-contact-tag, apply-contact-tag, unapply-contact-tag, update-contact-tag, delete-contact-tag) with 28 passing tests
- Membership command group (list-tiers, add-member, update-member-status) with 13 passing tests
- Organization command group (list-admins, list-calendars, list-events, transfer-event, create-calendar) with 19 passing tests
- Documentation (docs.md files for all source directories)

## Next Up
- Webhook commands

## Planned (subsequent commits)
1. ~~Project scaffolding + core infra + events commands~~ DONE
2. ~~Guest + host commands~~ DONE
3. ~~Ticket type commands~~ DONE
4. ~~Calendar commands (admins, coupons, event-tags, add/approve/reject)~~ DONE
5. ~~Contact commands (list, import, contact-tags)~~ DONE
6. ~~Membership commands~~ DONE
7. ~~Organization commands~~ DONE
8. Webhook commands
9. Utility commands (get-self, entity-lookup, image-upload)
