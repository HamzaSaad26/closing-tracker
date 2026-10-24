"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { seedDatabase } from "@/lib/seed";

/**
 * Puts the demo back to its starting state: the same 25 deals, with dates
 * relative to today. Deal ids and buyer links stay the same, so shared links
 * keep working. Demo-only: a real deployment wouldn't expose this.
 */
export async function resetDemo() {
  await seedDatabase();
  revalidatePath("/", "layout");
  redirect("/");
}
