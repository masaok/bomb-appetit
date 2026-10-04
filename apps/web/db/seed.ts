// Mirrors data/missions/*.json into the missions table. Safe to run any number of times.
//
//   pnpm db:seed
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { MISSIONS } from "../lib/missions";
import { missions } from "./schema";

config({ path: ".env.local", quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Put it in apps/web/.env.local (see .env.example).");
  process.exit(1);
}

const db = drizzle(neon(url));
const rows = MISSIONS.map((m) => ({
  id: m.id,
  title: m.title,
  section: m.section,
  order: m.order,
  caseSize: m.caseSize,
  timeLimitMs: m.timeLimitMs,
  strikeLimit: m.strikeLimit,
  modulePool: m.modulePool,
  needyPool: m.needyPool,
  moduleCount: m.moduleCount,
  needyCount: m.needyCount,
  fixedBombSeed: m.fixedBombSeed,
  ruleSeed: m.ruleSeed,
}));

await db
  .insert(missions)
  .values(rows)
  .onConflictDoUpdate({
    target: missions.id,
    set: Object.fromEntries(
      Object.entries(missions)
        .filter(([key]) => key !== "id" && key in rows[0]!)
        .map(([key, column]) => [key, sql.raw(`excluded."${(column as { name: string }).name}"`)]),
    ),
  });
// Missions removed from the JSON files are removed here too, so the table stays a mirror.
const ids = rows.map((r) => r.id);
await db.delete(missions).where(sql`${missions.id} not in ${ids}`);
console.log(`Seeded ${rows.length} missions.`);
