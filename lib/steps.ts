// The checklist every reserved deal goes through, in order.
// Simplified: the exact steps and documents vary by developer.

export type Owner = "buyer" | "broker" | "developer";

export type StepKey = "deposit" | "kyc" | "spa_issued" | "spa_signed" | "oqood";

export interface StepDef {
  key: StepKey;
  /** What the admin sees on the checklist. */
  label: string;
  /** The deal's stage once this step is done. */
  stage: string;
  /** Exactly one party owns each step, so "whose turn is it?" always has an answer. */
  owner: Owner;
  /** Deadline, in days after the reservation date. */
  dueDay: number;
  /** Plain-language copy for the buyer's page when this is the next step. */
  buyerNext: string;
  /** Short title for the buyer's timeline. */
  buyerLabel: string;
}

export const STEPS: StepDef[] = [
  {
    key: "deposit",
    label: "Booking deposit paid",
    stage: "Deposit received",
    owner: "buyer",
    dueDay: 7,
    buyerLabel: "Booking deposit",
    buyerNext:
      "Pay the booking deposit into the project escrow account. Your broker has the account details and can confirm once it lands.",
  },
  {
    key: "kyc",
    label: "KYC documents submitted",
    stage: "KYC complete",
    owner: "broker",
    dueDay: 10,
    buyerLabel: "ID documents",
    buyerNext:
      "Your broker is collecting your ID documents. If you haven't yet, send them a copy of your passport, visa or Emirates ID, and proof of address.",
  },
  {
    key: "spa_issued",
    label: "SPA issued to buyer",
    stage: "SPA issued",
    owner: "developer",
    dueDay: 14,
    buyerLabel: "Sale and Purchase Agreement prepared",
    buyerNext:
      "We're preparing your Sale and Purchase Agreement (SPA). Nothing is needed from you right now.",
  },
  {
    key: "spa_signed",
    label: "SPA signed by buyer",
    stage: "SPA signed",
    owner: "buyer",
    dueDay: 30,
    buyerLabel: "SPA signed",
    buyerNext:
      "Review and sign your SPA. Your broker can walk you through it, and our sales team can answer questions about the terms.",
  },
  {
    key: "oqood",
    label: "Oqood registered with DLD",
    stage: "Registered",
    owner: "developer",
    dueDay: 45,
    buyerLabel: "Registered with Dubai Land Department",
    buyerNext:
      "We're registering your unit with the Dubai Land Department (Oqood). Nothing is needed from you.",
  },
];

export const RESERVED_STAGE = "Reserved";
export const STAGES = [RESERVED_STAGE, ...STEPS.map((s) => s.stage)];

/** Booking deposit as a share of the price (assumption; varies by developer). */
export const DEPOSIT_RATE = 0.1;

export const OWNER_LABEL: Record<Owner, string> = {
  buyer: "Buyer",
  broker: "Broker",
  developer: "Developer",
};

export const PROJECT = {
  name: "Marlowe Residences",
  location: "Dubai Creek Harbour",
  developer: "Marlowe Developments",
  salesContact: { name: "Noor Al Mansoori", role: "Sales admin", phone: "+971 4 555 0142" },
};

/** Who is recorded as acting when the admin marks a step done. */
export const ADMIN_ACTOR = "Noor (Sales admin)";
