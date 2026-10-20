// The one read path. Every page, the feed, the sitemap and the llms.txt call
// these, and nothing else reads the posts table. Without a database (a clone with
// no secrets, the CI build) every list is empty and every post is missing.
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { posts } from "@/db/schema";
import { rowToPost } from "./rows";
import type { Post, PostSummary } from "./schema";

const published = and(eq(posts.draft, false), isNotNull(posts.publishedAt));

/** Every published post with its body, newest first. */
export async function listPublishedPostsWithBody(): Promise<Post[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(posts).where(published).orderBy(desc(posts.publishedAt), posts.slug);
  return rows.map(rowToPost);
}

/** Every published post without its body, newest first. */
export async function listPublishedPosts(): Promise<PostSummary[]> {
  const all = await listPublishedPostsWithBody();
  return all.map((post) => {
    const summary: PostSummary & { body?: string } = { ...post };
    delete summary.body;
    return summary;
  });
}

export async function getPublishedPost(slug: string): Promise<Post | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(posts)
    .where(and(published, eq(posts.slug, slug)))
    .limit(1);
  return row ? rowToPost(row) : null;
}
