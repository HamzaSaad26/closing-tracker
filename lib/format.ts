const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Dubai",
});
const longDateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Dubai",
});

export const fmtDate = (ms: number) => dateFmt.format(ms);
export const fmtDateTime = (ms: number) => dateTimeFmt.format(ms);
export const fmtLongDate = (ms: number) => longDateFmt.format(ms);

export function fmtAed(amount: number): string {
  return `AED ${new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** "due in 3 days", "due today", "2 days overdue" */
export function dueText(daysToDue: number): string {
  if (daysToDue > 1) return `due in ${daysToDue} days`;
  if (daysToDue === 1) return "due tomorrow";
  if (daysToDue === 0) return "due today";
  return `${plural(-daysToDue, "day")} overdue`;
}

export function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

/**
 * WhatsApp chat link for a contact. The seeded phone numbers are made up, so
 * on a public demo set DEMO_PHONE to route every WhatsApp button to one real
 * number instead of a stranger's. Server-side only (reads process.env).
 */
export function waLink(phone: string): string {
  const target = process.env.DEMO_PHONE || phone;
  return `https://wa.me/${target.replace(/[^\d]/g, "")}`;
}
