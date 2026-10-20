import { describe, expect, it } from "vitest";
import { authors, categories } from "./config";
import { listPostFiles, readKeywordMap, readPostFile } from "./files";
import { checkPosts } from "./rules";

/**
 * Every staged post passes every content rule, including the whole-blog rules. This is
 * the gate the pre-push hook and CI run; the seed refuses a post that fails the per-post
 * rules, so the database can never hold worse than what is here.
 */
describe("content/blog", () => {
  const slugs = listPostFiles();
  const posts = slugs.map(readPostFile);
  const keywordMap = readKeywordMap();

  it("has a post for every category", () => {
    const used = new Set(posts.filter((p) => !p.draft).map((p) => p.category));
    for (const c of categories) expect(used, `category ${c.slug} has no published post`).toContain(c.slug);
  });

  it("passes the content rules", () => {
    const { findings } = checkPosts(posts, {
      categories,
      authors,
      full: true,
      plannedSlugs: keywordMap.map((r) => r.slug),
      keywordMap,
    });
    expect(findings.map((f) => `${f.rule} ${f.slug}: ${f.message}`)).toEqual([]);
  });

  it("maps every post to the keyword plan", () => {
    const planned = new Map(keywordMap.map((r) => [r.slug, r]));
    for (const p of posts) {
      const row = planned.get(p.slug);
      expect(row, `${p.slug} is not in docs/blog-keywords.md`).toBeDefined();
      expect(row?.keyword.toLowerCase()).toBe(p.primaryKeyword.toLowerCase());
      expect(row?.category).toBe(p.category);
    }
  });
});
