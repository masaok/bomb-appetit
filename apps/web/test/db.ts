import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "@/db/client";
import * as schema from "@/db/schema";

/**
 * A real Postgres, in process, built from the migration files in ./drizzle. Tests that
 * use it run the same SQL as production and prove the migrations apply to an empty database.
 */
export async function testDb(): Promise<Db> {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });
  // Production uses the Neon HTTP driver. The queries under test use only what both share.
  return db as unknown as Db;
}

/** Removes every row, so one database can serve a whole test file. */
export async function emptyDb(db: Db): Promise<void> {
  await db.execute(sql`truncate runs, users, guests, rooms, room_players, mission_progress`);
}

let counter = 0;

export async function addUser(db: Db, name: string, ranked = true): Promise<string> {
  counter += 1;
  const [row] = await db
    .insert(schema.users)
    .values({ githubId: `gh-${counter}`, name, ranked })
    .returning({ id: schema.users.id });
  return row!.id;
}

const SPEC = {
  bombSeed: 1,
  ruleSeed: 1,
  timeLimitMs: 300_000,
  strikeLimit: 3,
  caseSize: "3x2",
  moduleCount: 1,
  modulePool: ["wires"],
  needyCount: 0,
  needyPool: [],
} as (typeof schema.runs.$inferInsert)["spec"];

/** Saves a run. Defaults describe a verified solo defusal of `first-bite` on epoch 1. */
export async function addRun(
  db: Db,
  run: Partial<typeof schema.runs.$inferInsert> & { timeRemainingMs: number },
): Promise<string> {
  counter += 1;
  const [row] = await db
    .insert(schema.runs)
    .values({
      ticketId: crypto.randomUUID(),
      missionId: "first-bite",
      defuserName: "Anonymous",
      bombSeed: 1,
      ruleSeed: 1,
      engineVersion: "1",
      spec: SPEC,
      result: "defused",
      reason: "Defused",
      strikes: 0,
      actionLog: { actions: [] } as unknown as (typeof schema.runs.$inferInsert)["actionLog"],
      verified: true,
      // Distinct, increasing times, so "the earlier run" is well defined in every test.
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, counter)),
      ...run,
    })
    .returning({ id: schema.runs.id });
  return row!.id;
}
