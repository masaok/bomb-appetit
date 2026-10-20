// The content check. Read-only: it reports, it never rewrites a post.
//
//   pnpm check:content                       the database rows (staged files if DATABASE_URL is unset)
//   pnpm check:content --files               the staged files in content/blog
//   pnpm check:content --files --slug a,b    only those, links resolved against the keyword map
//   pnpm check:content --report              also print the proof tables
//
// The same rules run over the staged files in lib/blog/content.test.ts, so `pnpm test`
// is the gate; this script is for checking what the database actually holds.
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { posts } from "../db/schema";
import { authors, categories } from "../lib/blog/config";
import { listPostFiles, readKeywordMap, readPostFile } from "../lib/blog/files";
import { checkPosts, type RulePost } from "../lib/blog/rules";

config({ path: ".env.local", quiet: true });

const args = process.argv.slice(2);
const useFiles = args.includes("--files") || !process.env.DATABASE_URL;
const slugArg = args.includes("--slug") ? args[args.indexOf("--slug") + 1]?.split(",") : null;
const report = args.includes("--report");

async function load(): Promise<RulePost[]> {
  if (useFiles) {
    if (!args.includes("--files"))
      console.log("DATABASE_URL is not set: checking the staged files in content/blog");
    const slugs = listPostFiles().filter((s) => !slugArg || slugArg.includes(s));
    const out: RulePost[] = [];
    for (const s of slugs) {
      try {
        out.push(readPostFile(s));
      } catch (e) {
        console.error(`valid-shape: ${e instanceof Error ? e.message : e}`);
        process.exitCode = 1;
      }
    }
    return out;
  }
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const rows = await db.select().from(posts).orderBy(desc(posts.publishedAt));
  return rows
    .filter((r) => !slugArg || slugArg.includes(r.slug))
    .map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      publishedAt: r.publishedAt?.toISOString() ?? null,
      updatedAt: r.updatedAt?.toISOString() ?? null,
    }));
}

const all = await load();
const keywordMap = readKeywordMap();
const result = checkPosts(all, {
  categories,
  authors,
  full: !slugArg,
  plannedSlugs: keywordMap.map((r) => r.slug),
  keywordMap: slugArg ? undefined : keywordMap,
});

if (report) {
  console.log("\n## Published posts per category\n");
  for (const c of result.perCategory) console.log(`${c.slug.padEnd(30)} ${c.published}`);
  console.log("\n## Words, floor, opening words, max section overlap, linked from\n");
  for (const p of result.perPost)
    console.log(
      `${p.slug.padEnd(52)} ${String(p.words).padStart(5)} / ${p.floor}  open ${String(p.answerWords).padStart(2)}  overlap ${
        p.maxOverlap ? `${p.maxOverlap.percent}% ${p.maxOverlap.with}` : "0%"
      }  <- ${p.linkedFrom.join(", ") || "(none)"}`,
    );
}

for (const f of result.findings) console.error(`${f.rule.padEnd(22)} ${f.slug}: ${f.message}`);
const source = useFiles ? "files" : "database";
console.log(
  `\nchecked ${all.length} posts from the ${source}: ${result.findings.length ? `${result.findings.length} findings` : "PASS"}`,
);
if (result.findings.length) process.exitCode = 1;
