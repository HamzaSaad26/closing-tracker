import { OWNER_LABEL, type Owner } from "@/lib/steps";

const LIGHT: Record<Owner, string> = {
  buyer: "bg-buyer-soft text-buyer",
  broker: "bg-broker-soft text-broker",
  developer: "bg-developer-soft text-developer",
};

const DOT: Record<Owner, string> = {
  buyer: "bg-buyer-dot",
  broker: "bg-broker-dot",
  developer: "bg-developer-dot",
};

/** Who owns a step. `tone="dark"` is for use on navy surfaces. */
export function OwnerBadge({ owner, tone = "light" }: { owner: Owner; tone?: "light" | "dark" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        tone === "dark" ? "bg-white/12 text-white ring-1 ring-white/15" : LIGHT[owner]
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[owner]}`} aria-hidden />
      {OWNER_LABEL[owner]}
    </span>
  );
}
