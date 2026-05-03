# Styled Shoot CRM

_Started 2026-05-03 15:01 UTC_

---

## User

My wife is starting a styled photoshoot business where she creates events, like this mock wedding with a ton of vendors, venues, etc. then gets models/photographers/vendors to pay to join. We need to create a web based CRM that is easy to use from both mobile and desktop where we can keep track of all of our events, vendors, photographers, models, etc. We need to. be able to keep track of who has signed and paid, who is doing what, what event they are related to, etc. It needs to be beautiful, easy to use for my wife and fully functional.

## Assistant

I'll help you build a beautiful, functional CRM for your wife's styled photoshoot business. Before I dive in, let me ask some focused questions so I build the right thing — and let me peek at the design system in parallel so I know what I'm working with.

_[tool: list_files]_

_[tool: questions_v2]_

## User

Questions answered:
- business_name: Casa Cross
- primary_user: My wife + me
- device_priority: Mobile primarily (on-site, on-the-go)
- core_entities: Events / shoots, Vendors (florists, rentals, etc), Venues, Photographers, Models, Hair & Makeup, Stylists, Sponsors, Invoices / payments, Contracts / signed agreements, Mood boards / inspiration, Tasks / to-dos
- event_lifecycle: Decide for me
- payment_tracking: Amount owed + amount paid + due date
- signature_tracking: Status + ability to upload the signed PDF
- communication: Bulk email/SMS to event participants, Automated reminders (payment due, signature missing), Shared event chat, Individual contact log (notes per person)
- vibe: Clean & airy (whites, soft neutrals, modern serif)
- key_views: Dashboard (overview of everything), Event detail page (with all participants), Calendar view of events, Person detail page (one vendor/photographer/model), Roster / people directory
- variations: Just one — your best take
- fidelity: Fully clickable prototype with realistic data
- real_data: Magnolia Bridal Styled Shoot upcoming on May 12

## Assistant

Got it. Mobile-first, clean & airy, fully clickable prototype with the full vendor/event/payment/contract stack. Let me explore the design system first.

_[tool: list_files]_

_[tool: list_files]_

The design system project appears empty, so I'll establish a clean, airy aesthetic from scratch — modern serif headings, soft neutrals, generous whitespace. Let me set up the project.

_[tool: update_todos]_

Let me start with the main HTML shell, design tokens, and seed data, then build components.

_[tool: write_file]_

_[tool: write_file]_

Now seed data with realistic, rich content centered around the Magnolia Bridal shoot:

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

I notice I used `var(--s-5)` and `var(--s-6)` as JS expressions in some inline styles in event_detail.jsx — that's a bug. Let me fix that and continue building.

_[tool: str_replace_edit]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Built the Casa Cross CRM — a fully clickable mobile-first prototype. Here's what's in it:

**Five tabs:** Home, Events, Calendar, People, Messages — plus drill-in screens for any event or person.

**Centered around your real shoot:** Magnolia Bridal on May 12 is the up-next event, with all 14 participants seeded (Eliza, Theo, Naomi, Petal & Stem, Magnolia Manor, Heirloom Bridal, etc.) at realistic rates with mixed payment + contract states.

**The functionality you asked for:**
- Events with stage tracking (Idea → Pitching → Booking → Prep → Live → Wrapped) and rich detail (overview, roster grouped by role, money, tasks, mood board)
- Per-participant amount owed / paid / due date — visible in event Money tab and per-person Money tab
- Contract status (unsent / sent / signed) — uploadable PDF supported in the design
- Bulk reminders, per-event group chat, individual contact log per person
- Tasks with due dates, weekly view on dashboard
- Calendar with event dots and day detail

**Vibe:** Fraunces + Instrument Serif, soft warm whites with terracotta + sage accents, generous whitespace. Looks like a phone on desktop (with notch), full-bleed on mobile.

A few things to know:
- Add/edit forms are stubbed as toasts — wiring real CRUD is the next step once you've lived in it for a few days
- The 7 cover gradients stand in for real shoot photography — drop in real images when you have them
- All data is in `data.jsx`, easy to extend

Tap around: try the Magnolia Bridal card → Money tab and the Roster tab, then visit a person like Naomi Aldridge to see their event history and earnings. The chat icon on the event detail opens the group thread.

