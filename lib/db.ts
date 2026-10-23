import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Local development uses a SQLite file. In production, set TURSO_DATABASE_URL
// (and TURSO_AUTH_TOKEN) to a hosted libSQL database: serverless hosts like
// Vercel don't keep writes to the local filesystem.
export const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });
