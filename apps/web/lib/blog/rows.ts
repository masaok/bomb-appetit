import type { PostRow } from "@/db/schema";
import type { Post } from "./schema";

/** A database row as the pages see it. Rows without a published date never reach here. */
export function rowToPost(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    primaryKeyword: row.primaryKeyword,
    secondaryKeywords: row.secondaryKeywords,
    length: row.length === "short" ? "short" : "full",
    tags: row.tags,
    author: row.author,
    image: row.image,
    draft: row.draft,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}
