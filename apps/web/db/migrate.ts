// Applies the SQL files in ./drizzle in order, holding a Postgres advisory lock so two
// deploys (or a deploy and a developer) can never run migrations at the same time.
//
//   pnpm db:migrate
import { Pool } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

config({ path: ".env.local", quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Put it in apps/web/.env.local (see .env.example).");
  process.exit(1);
}

// Any fixed 64-bit number works; every migration runner for this app must use this one.
const MIGRATION_LOCK = 4_207_193_301;

const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query("select pg_advisory_lock($1)", [MIGRATION_LOCK]);
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Migrations are up to date.");
} finally {
  await client.query("select pg_advisory_unlock($1)", [MIGRATION_LOCK]).catch(() => {});
  client.release();
  await pool.end();
}
