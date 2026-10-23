import { OWNER_LABEL, type Owner } from "@/lib/steps";

const STYLES: Record<Owner, string> = {
  buyer: "bg-buyer-soft text-buyer",
  broker: "bg-broker-soft text-broker",
  developer: "bg-developer-soft text-developer",
};

export function OwnerBadge({ owner, prefix }: { owner: Owner; prefix?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${STYLES[owner]}`}
    >
      {prefix ? `${prefix} ` : ""}
      {OWNER_LABEL[owner]}
    </span>
  );
}
