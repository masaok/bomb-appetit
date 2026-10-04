import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { env } from "@/lib/server/env";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

let cached: Db | null = null;

/** Null when no DATABASE_URL is set. The game still runs; rooms, saved runs and leaderboards do not. */
export function getDb(): Db | null {
  if (!env.databaseUrl) return null;
  cached ??= drizzle(neon(env.databaseUrl), { schema });
  return cached;
}
