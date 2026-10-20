// Saves the staged post files in content/blog through savePost, one at a time.
// Idempotent: unchanged posts are left alone, and a post edited in the
// database since its last seed is skipped unless --force.
//
//   pnpm blog:seed                 every file
//   pnpm blog:seed --only a,b      just those slugs
//   pnpm blog:seed --force         overwrite database edits
//
// Afterwards it POSTs to BLOG_REVALIDATE_URL with CRON_SECRET when both are set, so the
// live pages refresh without a deploy.
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { listPostFiles, readPostFile } from "../lib/blog/files";
import { savePost } from "../lib/blog/write";

config({ path: ".env.local", quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Put it in apps/web/.env.local (see .env.example).");
  process.exit(1);
}

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1]?.split(",") : null;
const force = args.includes("--force");
const db = drizzle(neon(url));

async function revalidate() {
  const target = process.env.BLOG_REVALIDATE_URL;
  const secret = process.env.CRON_SECRET;
  if (!target || !secret) {
    console.log(
      "BLOG_REVALIDATE_URL or CRON_SECRET not set: pages refresh within the hour or on the next deploy",
    );
    return;
  }
  const res = await fetch(target, { method: "POST", headers: { Authorization: `Bearer ${secret}` } });
  console.log(`revalidate ${target}: ${res.status}`);
}

const slugs = listPostFiles().filter((s) => !only || only.includes(s));
if (only) for (const s of only) if (!slugs.includes(s)) throw new Error(`no file content/blog/${s}.md`);
const counts: Record<string, number> = {};
let failed = 0;
for (const slug of slugs) {
  try {
    const result = await savePost(db, readPostFile(slug), { force });
    counts[result.outcome] = (counts[result.outcome] ?? 0) + 1;
    if (result.outcome !== "unchanged") console.log(`${result.outcome.padEnd(15)} ${slug}`);
  } catch (e) {
    failed += 1;
    console.error(`FAILED          ${slug}\n${e instanceof Error ? e.message : e}`);
  }
}
console.log(
  `\n${slugs.length} files: ${Object.entries(counts)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ")}${failed ? `, ${failed} failed` : ""}`,
);
if (Object.keys(counts).some((k) => k !== "unchanged")) await revalidate();
if (failed) process.exit(1);
