# Closing Tracker: from "reserved" to signed SPA

**Live:** [link]  ·  **Repo:** [link]

## The problem

Most off-plan sales tooling stops at the moment a unit is reserved. But a reservation isn't a sale yet. Before the deal is real, the buyer still has to:

- pay the booking deposit,
- submit KYC documents,
- receive and sign the SPA,
- have the unit registered (Oqood).

That stretch takes weeks and involves three parties. The buyer has to act, the broker chases, and the developer's sales admin issues documents and confirms payments. Nobody has a shared view of where a deal is stuck or whose turn it is. Buyers don't know what's expected of them next and ask the broker, who asks the sales team. Some reserved deals quietly die here, and the sales manager often finds out only when the unit goes back on the market.

I picked this stage because it's where information gets lost between the parties and where buyers wait for answers, two of the three pains in the brief. It's also the last step before the developer gets paid and the broker earns commission.

## Who it's for

The developer's **sales admin or sales manager**, who is responsible for turning reservations into signed SPAs.

The **buyer** gets one read-only link to their deal. It isn't a second product; it removes the "what's next?" questions that otherwise land on the sales team.

## What I built

- **Deals board.** Every reserved deal is shown by stage: Reserved → Deposit received → KYC complete → SPA issued → SPA signed → Oqood registered. Each card shows days in its current stage and who owns the next step, and turns red when that step is past its deadline. Two numbers sit at the top: deals at risk, and median days from reservation to SPA.
- **Deal page.** A checklist of steps, each with an owner (buyer, broker or developer), a due date and a completion timestamp. The admin can mark a step done, and an activity log records every change.
- **Buyer link.** A no-login page per deal, opened through a private link. It explains in plain language what's done, what's next, what's needed from the buyer, the deadline, and who to contact. It's designed mobile-first.

## What I left out

- **A broker view and commission tracking.** Brokers would see what's blocking their deals and when commission unlocks. It's the natural next screen, but it's a second user.
- **Fuller analytics:** where deals stall, cancellation rate, reservation-to-SPA rate per broker.
- **Real authentication, file uploads and e-signature.** Steps are marked done manually.
- **Integrations** with DLD, payment gateways or a CRM. In production, a "reserved" event from the CRM or sales platform would create the deal.
- **Sending WhatsApp or email reminders.**
- **Everything after Oqood:** installments, construction updates, handover.

## Main decisions

- **A deal's stage is derived from its checklist.** There's no separate status field that can drift out of sync. The checklist is the single source of truth.
- **Every step has exactly one owner.** The real problem is ambiguity about who everyone is waiting on, so the board always answers "whose turn is it?"
- **Deadlines are set relative to the reservation date and checked when a page is read.** "At risk" is computed whenever the page loads, so no cron job is needed.
- **The buyer gets a private link, not an account.** Buyers won't create an account for a one-off purchase. The link shows only buyer-relevant information, never internal notes.
- **One primary user.** I built the tool for the person who owns the outcome, and gave everyone else read-only visibility rather than separate tools.

## Assumptions

- One developer, one project, about 25 reserved deals in the seed data at different stages, some overdue. All data is made up, and prices are in AED.
- Default deadlines from the reservation date: deposit within 7 days, KYC within 10, SPA issued by day 14, SPA signed by day 30, Oqood registered by day 45. In a real version these would be set per project.
- The booking deposit is 10% of the price. This varies by developer.
- The step list is simplified. The exact order and documents vary by developer.
- Steps happen in order. The admin can only mark the next open step done, and only undo the most recent one.
- This tool starts where a sales platform's flow ends, at "unit reserved".

## Stack

Next.js 16 (App Router, server actions), Drizzle ORM, SQLite locally and Turso in production, Tailwind CSS 4. Deployed on Vercel.

## Run locally

Requires Node 20 or later.

```bash
npm install
npm run db:seed   # creates local.db with ~25 made-up deals
npm run dev
```

Open http://localhost:3000 for the deals board. On any deal page, "Open buyer link" shows that buyer's view.

The seed dates are relative to the moment you run it, so run `npm run db:seed` again any time to reset the demo.

```bash
npm test          # unit tests for the stage and deadline logic
```

## Deploy

Vercel doesn't keep writes to the local filesystem, so production uses [Turso](https://turso.tech) (hosted SQLite with the same client).

1. Create a Turso database and copy its URL and auth token.
2. Seed it from your machine: `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:seed`
3. Import the repo in Vercel and set the same two environment variables.
4. Optional: set `DEMO_PHONE` to a number you own. The seeded phone numbers are made up, and this sends every WhatsApp button to that one number instead.

## Code map

- `lib/steps.ts`: the checklist (owners, deadlines, buyer-facing copy). Change the process here.
- `lib/derive.ts`: stage, next step, deadlines and "at risk", computed from the checklist and the current time. Unit-tested in `lib/derive.test.ts`.
- `lib/schema.ts`, `lib/deals.ts`: database tables and queries.
- `app/page.tsx`: deals board.
- `app/deals/[id]/`: deal page and the mark-done / undo server actions.
- `app/b/[token]/page.tsx`: buyer link.
- `scripts/seed.ts`: made-up data.

## Docs

- [Design spec](docs/design-spec.md): process model, derived-state rules, screen-by-screen behaviour, visual design, edge cases, privacy.
- [Implementation plan](docs/implementation-plan.md): architecture, how v1 was delivered, testing, and the phased path to production.
