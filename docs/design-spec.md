# Closing Tracker: design spec

v1 · 23 October 2026 · Hamza Saad

The plan for building it is in [implementation-plan.md](./implementation-plan.md).

## 1. The idea in a few sentences

Most off-plan sales tools stop when a unit is **reserved**. But a reservation isn't a sale. Before it becomes one, the buyer still has to pay the deposit, send their documents and sign the SPA, and then the developer registers the unit with the Dubai Land Department.

That takes weeks, and nobody can see where each deal is stuck or whose turn it is. Buyers ask the broker "what's next?", the broker asks the sales team, and some deals quietly die.

Closing Tracker gives the sales admin **one board of every reserved deal**, showing whose turn it is and what's late. Each buyer gets **a private link** that answers "what do you need from me?" without a phone call.

## 2. Ground rules

- **Every step has exactly one owner.** The buyer, the broker or the developer. Never "everyone". The whole point is knowing who we're waiting on.
- **Nothing is stored that can be worked out.** A deal's stage and whether it's late are calculated from the checklist every time a page opens. No status field that can get out of sync, and no background job.
- **The buyer never logs in.** They get a private link. They won't create an account for a one-off purchase.
- **The buyer only sees what's theirs.** Their progress, their next step, their contacts. Never risk flags, internal notes, other deals or broker performance.
- **Late is red, and only late is red.** Colour means something on this board; it's never decoration.
- **Plain words for the buyer.** "Booking deposit", not "EOI"; "Registered with Dubai Land Department", not "Oqood".

## 3. What v1 includes

| Part | What it does |
| --- | --- |
| **Deals board** | Every reserved deal in columns by stage. Each card shows the next step, whose turn it is and how many days are left. Late deals have a red outline. |
| **Deal page** | The checklist for one deal. The admin marks steps done (or undoes the last one), sees who to chase, and reads the history. |
| **Buyer link** | A phone-first page for the buyer: what's done, what's next, what we need from them, by when, and who to ask. |
| **Demo data** | 25 made-up deals at every stage, some on time and some late, with dates relative to today. **Reset demo data** in the account menu puts them back; deal pages and buyer links stay the same. |

## 4. What is NOT in v1

- **Logins and roles.** Anyone with the admin link can mark steps done. Fine for a demo with made-up data, and the first thing to fix (scope 2).
- **A broker view and commission tracking.** Brokers show up as owners and contacts, but have no screen of their own.
- **Sending messages.** WhatsApp buttons open a chat; nothing is sent automatically.
- **Uploading documents, e-signing, taking payments.** Steps are ticked by hand.
- **Connecting to the CRM or Parallex.** Deals come from demo data, not from a real "reserved" event.
- **Anything after registration:** instalments, construction updates, handover.
- **More than one developer or project.**

## 5. Who does what

| Who | What they do | In v1 |
| --- | --- | --- |
| **Sales admin** (developer) | Ticks steps, chases whoever is late, shares the buyer link | Uses the board and the deal page |
| **Sales manager** (developer) | Wants to know how many deals are at risk and how long they take to close | Reads the two numbers at the top of the board |
| **Buyer** | Pays, sends documents, signs | Reads their buyer link |
| **Broker** | Collects documents, chases the buyer | Shown as an owner and a contact only |

## 6. Life of a deal

Every deal goes through the same five steps, in this order:

| # | Step | Whose turn | Due (days after reserving) | Stage when done |
| --- | --- | --- | --- | --- |
| — | *Unit reserved* | — | day 0 | **Reserved** |
| 1 | Booking deposit paid | Buyer | 7 | **Deposit received** |
| 2 | KYC documents submitted | Broker | 10 | **KYC complete** |
| 3 | SPA issued to buyer | Developer | 14 | **SPA issued** |
| 4 | SPA signed by buyer | Buyer | 30 | **SPA signed** |
| 5 | Oqood registered with DLD | Developer | 45 | **Registered** |

The deposit is 10% of the price.

**Steps happen in order.** The admin can only tick the next step, and can only undo the last one ticked.

These steps and deadlines are my best guess. Every developer does it a bit differently, so they all live in one file (`lib/steps.ts`) and can be changed in one place.

## 7. How "late" works

- A deal is **at risk** when today is past the due date of its next step.
- **Days left** counts down to that due date. Once it's passed, it becomes "3 days overdue".
- **Days in this stage** counts from the last step ticked (or from the reservation).
- **Median days to SPA** is the middle value of "reservation to SPA signed" across every deal that has signed.

Nothing is stored. Open the board tomorrow and a deal that was "due today" shows as "1 day overdue" on its own.

## 8. The buyer link

The card at the top changes with whose turn it is:

| Whose turn | Heading | What it says |
| --- | --- | --- |
| Buyer | **What we need from you** | What to do, in plain words, and the deadline. For the deposit, the exact amount. |
| Broker | **Your broker is on it** | What the broker is doing, and when to expect it. |
| Developer | **Nothing needed from you** | What we're preparing, and when to expect it. |
| All done | **All done** | The unit is registered; the broker will be in touch about the payment plan and handover. |

**If it's late:** a calm line suggesting they message their broker. Never red, never an alarm.

Below the card: a timeline of every step (date done, or "by" date), then two contacts, their broker and our sales team, each with a WhatsApp button.

The link is a long random code, so it can't be guessed, and search engines are told not to index it. The page asks the buyer not to share it.

## 9. Screens at a glance

Every screen has one obvious main action.

| Screen | Who | What's on it | Main button |
| --- | --- | --- | --- |
| **Deals board** | Sales admin, manager | "At risk" and "Median days to SPA" numbers; tabs for All, At risk, Waiting on buyer / broker / developer; one column per stage | Open a deal |
| **Deal page** | Sales admin | "Whose turn" banner, five-step checklist, buyer and broker contacts, history | Mark done |
| **Buyer link** | Buyer | Progress bar, next-step card, timeline, contacts | WhatsApp the broker |

## 10. Ties, double-clicks and manual fixes

| What happens | What the app does |
| --- | --- |
| Admin ticks a step by mistake | **Undo** on the last ticked step. The undo is logged too. |
| Admin double-clicks "Mark done" | The second click does nothing, and the history only shows it once. |
| Someone tries to tick a step that isn't next | Refused. |
| A deadline passes overnight | The deal turns red the next time anyone opens the board. |
| Wrong deal number or old buyer link | "Page not found". |
| Seeded phone numbers are made up | On the live demo, every WhatsApp button goes to one real number (`DEMO_PHONE`), so no stranger gets a message. |

## 11. How it looks

Calm, light and glassy, so it sits naturally next to the Parallex product. Frosted white panels float on a misty blue-grey background with soft blue glows. The colour always tells you something.

| Colour | Means |
| --- | --- |
| Misty blue-grey background, frosted white panels | Everything neutral |
| **Deep navy** (`#101624`) | The main action on each screen: Mark done, Open buyer link, WhatsApp |
| **Blue scale** (`#506FB3` → `#678EE5`) | Numbers, progress, steps done |
| **Amber** | Buyer's turn |
| **Purple** | Broker's turn |
| **Blue** | Developer's turn |
| **Red** | Late. Nothing else. |

- **Glass:** panels are translucent white with a background blur, a hairline border and a long, soft shadow. Nothing has a hard edge.
- **Shapes:** pill buttons and tabs; big rounded corners (16–28px).
- **Type:** Inter Tight, a tight modern grotesk. Headlines and big numbers are set large with tight letter-spacing; numbers line up (tabular figures).
- **The "whose turn" bar** on a deal is a solid navy strip, so it's the first thing you read.
- **The buyer page** opens on a deep blue gradient card ("Hi Sara") with the next step floating over it as a frosted card. It's one narrow column, built for a phone, because buyers open it from WhatsApp.
- **The board** uses columns, like Trello or Pipedrive, so nobody has to learn it.
- **Dates** are always Dubai time.

## 12. Still open

1. **Are these the right five steps and deadlines** for the developers Parallex works with, or does every developer differ so much that each project needs its own list from day one?
2. **Who really collects KYC:** the broker or the developer's sales admin?
3. **Where does this live:** inside Parallex (starting automatically when a Dealbox turns into a reservation) or next to it?
4. **What should the broker see:** the same page as the buyer, or an internal one with commission status?

## 13. How we'll know it works

**For the demo (v1):**
- The board shows every deal in the right column, and late deals are red.
- Ticking a step moves the deal to the next column, updates the history, and changes the buyer link.
- Undo puts everything back.
- The buyer link reads well on a phone and never shows internal information.

**If it went live:**
- Median days from reservation to signed SPA goes down.
- Fewer deals are at risk at any one time.
- Fewer reservations are cancelled before the SPA.
- The sales team gets fewer "what's next?" messages.
