// The one write path. The seed script saves posts through savePost; nothing else
// writes the posts table. The database is passed in so the script can open its own
// connection (db/client.ts is server-only and cannot load under tsx).
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { posts } from "@/db/schema";
import { authors, categories } from "./config";
import { checkPost } from "./rules";
import { postInputSchema, type PostInput } from "./schema";

export type SaveResult = { slug: string; outcome: "inserted" | "updated" | "unchanged" | "skipped-edited" };

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

export async function savePost(
  db: NeonHttpDatabase,
  input: PostInput,
  { force = false } = {},
): Promise<SaveResult> {
  const post = postInputSchema.parse(input);
  const findings = checkPost(post, { categories, authors, full: false });
  if (findings.length) {
    throw new Error(
      `${post.slug} fails the content rules:\n${findings.map((f) => `  ${f.rule}: ${f.message}`).join("\n")}`,
    );
  }

  const [existing] = await db.select().from(posts).where(eq(posts.slug, post.slug)).limit(1);
  const hash = md5(post.body);

  if (existing) {
    // A body changed in the database since the last seed wins unless forced
    if (!force && existing.seededHash && md5(existing.body) !== existing.seededHash) {
      return { slug: post.slug, outcome: "skipped-edited" };
    }
    const values = {
      title: post.title,
      description: post.description,
      category: post.category,
      primaryKeyword: post.primaryKeyword,
      secondaryKeywords: post.secondaryKeywords,
      length: post.length,
      tags: post.tags,
      author: post.author,
      image: post.image ?? null,
      body: post.body,
      draft: post.draft,
      seededHash: hash,
      // Dates move only when the file says so
      ...(post.publishedAt ? { publishedAt: new Date(post.publishedAt) } : {}),
      ...(post.updatedAt !== undefined
        ? { updatedAt: post.updatedAt ? new Date(post.updatedAt) : null }
        : {}),
    };
    const same =
      existing.seededHash === hash &&
      existing.title === values.title &&
      existing.description === values.description &&
      existing.category === values.category &&
      existing.primaryKeyword === values.primaryKeyword &&
      existing.length === values.length &&
      existing.author === values.author &&
      (existing.image ?? null) === values.image &&
      existing.draft === values.draft &&
      existing.tags.join() === values.tags.join() &&
      existing.secondaryKeywords.join() === values.secondaryKeywords.join() &&
      (!post.publishedAt || existing.publishedAt?.getTime() === new Date(post.publishedAt).getTime()) &&
      (post.updatedAt === undefined ||
        (existing.updatedAt?.getTime() ?? null) ===
          (post.updatedAt ? new Date(post.updatedAt).getTime() : null));
    if (same) return { slug: post.slug, outcome: "unchanged" };
    await db.update(posts).set(values).where(eq(posts.slug, post.slug));
    return { slug: post.slug, outcome: "updated" };
  }

  const now = new Date();
  await db.insert(posts).values({
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    primaryKeyword: post.primaryKeyword,
    secondaryKeywords: post.secondaryKeywords,
    length: post.length,
    tags: post.tags,
    author: post.author,
    image: post.image ?? null,
    body: post.body,
    draft: post.draft,
    createdAt: now,
    publishedAt: post.draft ? null : post.publishedAt ? new Date(post.publishedAt) : now,
    updatedAt: post.updatedAt ? new Date(post.updatedAt) : null,
    seededHash: hash,
  });
  return { slug: post.slug, outcome: "inserted" };
}
