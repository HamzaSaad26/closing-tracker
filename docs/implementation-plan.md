# Closing Tracker: implementation plan

v1 · 23 October 2026 · Hamza Saad

What it does and why is in [design-spec.md](./design-spec.md).

## 1. The plan in a few sentences

Closing Tracker ships in **four scopes**. Each one works on its own.

Scope 1 is the take-home demo: one admin, made-up deals, a working board and buyer link. Scope 2 makes it safe for real data. Scope 3 makes it run itself: deals arrive from the CRM and people get reminded. Scope 4 brings in the broker.

| Scope | Effort | Goal | Who uses it |
| --- | --- | --- | --- |
| **1. Demo** ✅ | ~4 hours (done) | Show the idea end to end: board, deal page, buyer link | One sales admin, buyers via link |
| **2. Safe for real data** | ~1 week | Logins, real users recorded on every action, steps set per project | Sales admins and managers of one developer |
| **3. Runs itself** | ~1 week | Deals created automatically on reservation; reminders before and after deadlines | Same, with far less manual ticking |
| **4. Brokers** | ~1 week | Broker logins, their own deals, commission status | Brokers and agencies |

The efforts are rough, for one developer. Documents, e-signature and payments come after scope 4, once we know which providers the developers already use.

## 2. How it's built

- **One Next.js app** on Vercel. Pages are rendered on the server and read the database directly. No separate API to maintain.
- **SQLite** (a local file in development, Turso in production), through Drizzle.
- **Writes are server actions:** "mark done" and "undo" check the step order, save the change and a history entry, then refresh the board.
- **The process lives in one file.** `lib/steps.ts` lists the five steps, their owners, deadlines and the buyer's wording.
- **The rules live in one file.** `lib/derive.ts` works out stage, next step and "late" from the checklist and today's date. It reads nothing and writes nothing, so it's easy to test.

| Choice | Why | What it costs |
| --- | --- | --- |
| Next.js | Screens and writes in one codebase; one-click deploy | Tied to Next's way of doing things |
| SQLite / Turso | No setup locally, same code in production, free tier | Fewer tools than Postgres |
| Drizzle | Typed queries, thin layer | No migrations yet: the seed rebuilds the tables |
| Tailwind | Fast to build; all colours in one place | Long class lists |
| No logins | The demo opens in one click | Must come first before real data (scope 2) |

## 3. Scope 1: Demo ✅

**Goal:** one sales admin can see every reserved deal, know who to chase, tick steps, and share a status link with the buyer.

| Must have | Status |
| --- | --- |
| **Steps and rules:** five steps with owners and deadlines; stage, next step and "late" worked out on every page load | ✅ Done, 7 unit tests |
| **Demo data:** 25 deals across every stage, some late, dates relative to today | ✅ Done |
| **Deals board:** "at risk" and "median days to SPA" numbers, filter tabs, stage columns, cards with whose turn and days left | ✅ Done |
| **Deal page:** whose-turn banner, checklist, mark done, undo last, contacts, history | ✅ Done |
| **Buyer link:** progress, next-step card worded by whose turn, timeline, contacts, phone-first | ✅ Done |
| **Live link:** Turso database, Vercel, environment variables | ✅ Done |

| Nice to have | Status |
| --- | --- |
| WhatsApp buttons go to one real number on the demo (`DEMO_PHONE`) | ✅ Done |
| **Reset demo data** in the account menu, so reviewers can click freely; rebuilds in one transaction, links stay the same | ✅ Done |
| Logins | ✂️ Deliberately left out of the demo, first thing in scope 2 |
| A broker view | ✂️ Cut, moved to scope 4 |
| An AI-drafted chase message | ✂️ Cut |
| More analytics (where deals stall, cancellations) | ✂️ Cut |

**How the 4 hours went:**

| Step | Time |
| --- | --- |
| Set up the project | 15 min |
| Steps, rules and tests | 30 min |
| Tables and demo data | 30 min |
| Deals board | 45 min |
| Deal page, mark done and undo | 45 min |
| Buyer link | 40 min |
| Deploy | 20 min |
| README and polish | 15 min |

## 4. Scope 2: Safe for real data

**Goal:** a developer can put real buyers in it.

| Must have | Nice to have (cut first if late) |
| --- | --- |
| **Logins** for developer staff (email link or Google), with two roles: admin (can tick) and viewer (manager, read-only) | Single sign-on with the developer's own accounts |
| **Every page and action checks the login.** The buyer link stays login-free. | Audit export (CSV of every change) |
| **The real person** is saved on every tick and undo, instead of the fixed "Noor (Sales admin)" | |
| **Buyer links can be turned off** (e.g. if a buyer forwards it by mistake) | Links that expire after registration |
| **Steps per project:** move the five steps from code into the database so each project can have its own list | An editor screen for the step list |
| **Each deal keeps a copy of its steps** when it's created, so changing a project's steps doesn't rewrite old deals | |
| **Proper migrations** instead of the seed rebuilding the tables | |

**New tables:** users, sessions, projects, project steps.

## 5. Scope 3: Runs itself

**Goal:** nobody types deals in, and nobody has to remember to chase.

| Must have | Nice to have (cut first if late) |
| --- | --- |
| **Deals arrive automatically.** A webhook the CRM (or Parallex) calls when a unit is reserved: unit, price, buyer, broker, time. | Backfill: import deals already reserved |
| **Safe webhook:** signed requests; the same reservation sent twice creates one deal | Status sync back to the CRM when a deal is registered |
| **Daily reminders:** the owner of a step hears about it 2 days before the deadline and on the day it goes late | A Monday summary for the sales manager |
| **Reminders never change a deal.** They only send messages. The rules stay calculated on every page load. | Quiet hours, and a mute button per deal |
| **No double sends:** a log of what was sent to whom | |

**This is the one place a background job is worth it**, because sending messages has to happen even when nobody opens the board.

**New tables:** notifications. **New columns:** `deals.external_id` (unique).

## 6. Scope 4: Brokers

**Goal:** the broker sees their own deals and knows when they get paid.

| Must have | Nice to have (cut first if late) |
| --- | --- |
| **Broker logins**, seeing only their own deals | Agency owners see all their brokers' deals |
| **What's blocking each deal** and what the broker should do next | |
| **Commission status:** locked until the SPA is signed and the buyer has paid the threshold (set per developer, e.g. 20%), then payable, then paid | Payout dates and amounts |
| **For the manager:** reservation-to-SPA rate per broker, so you see who brings buyers who actually close | Trends over time |

## 7. After scope 4

These need the developers' existing providers, so we'd ask before building:

- **Documents:** buyers upload KYC directly, stored securely
- **E-signature** for the SPA
- **Payments:** the deposit confirmed by the escrow bank or payment gateway instead of a manual tick

## 8. How we test it

| What | Scope 1 | From scope 2 |
| --- | --- | --- |
| The rules (stage, late, days) | Unit tests, `npm test` | Add one test set per project's step list |
| Mark done and undo | Clicked through in a real browser | Automated tests against a throwaway database |
| The three screens | Checked at desktop and phone size | Automatic smoke tests on every pull request |
| Types | `npm run typecheck` | Runs on every pull request |

## 9. What could go wrong

| Risk | What we do about it |
| --- | --- |
| Every developer's steps are different | One file now; per-project steps in scope 2 |
| A buyer forwards their link | It shows nothing internal; links can be turned off in scope 2 |
| Admins forget to tick steps, so the board goes stale | Scope 3 and the providers after scope 4 replace ticks with real events |
| Reminders feel like spam | One message per step per deadline, quiet hours, mute |
| SQLite gets too small | Fine at this size; queries go through Drizzle, so moving to Postgres stays contained |

## 10. Still open

1. **Which CRM** do Parallex's developers use, and can it call a webhook on "reserved"?
2. **WhatsApp or email** for reminders? WhatsApp needs a Business API account per developer.
3. **Who sets the step list:** Parallex, once per developer, or each developer's admin?
4. **Commission rules:** is "SPA signed and 20% paid" common, or does it vary too much to standardise?
