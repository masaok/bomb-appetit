import { describe, expect, it } from "vitest";
import { authors, categories } from "./config";
import { checkPost, checkPosts, type RulePost } from "./rules";

const ctx = { categories, authors, full: false };

const paragraph = (n: number, seed = "word") =>
  Array.from({ length: n }, (_, i) => `${seed}${i % 7}`).join(" ") + ".";

/** A post that passes every per-post rule; each test breaks one thing. */
function goodPost(over: Partial<RulePost> = {}): RulePost {
  const sections = [
    "## What does the sample keyword need?",
    "## How is the sample keyword set up?",
    "## The sample keyword mistake to avoid",
    "## Sample keyword checklist",
  ]
    .map((h, i) => `${h}\n\n${paragraph(30, `open${i}`)}\n\n${paragraph(380, `body${i}`)}\n`)
    .join("\n");
  return {
    slug: "sample-keyword-post",
    title: "Sample Keyword: A Title",
    description:
      "A sample keyword description that is long enough to satisfy the rule and mentions the sample keyword with every main word in it here.",
    category: categories[0]!.slug,
    primaryKeyword: "sample keyword",
    length: "full",
    author: authors[0]!.slug,
    draft: false,
    body: `A sample keyword opening paragraph ${paragraph(42, "intro")}\n\n${sections}`,
    publishedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

const rulesOf = (post: RulePost) => checkPost(post, ctx).map((f) => f.rule);

describe("checkPost", () => {
  it("passes the fixture", () => {
    expect(checkPost(goodPost(), ctx)).toEqual([]);
  });
  it("reserved-slug", () => {
    expect(rulesOf(goodPost({ slug: "recent" }))).toContain("reserved-slug");
  });
  it("keyword-placement in the title, slug, description and first paragraph", () => {
    expect(rulesOf(goodPost({ title: "Something Else" }))).toContain("keyword-placement");
    expect(rulesOf(goodPost({ slug: "other-post" }))).toContain("keyword-placement");
    expect(rulesOf(goodPost({ description: paragraph(25, "plain") }))).toContain("keyword-placement");
    expect(
      rulesOf(goodPost({ body: goodPost().body.replace("A sample keyword opening", "An opening") })),
    ).toContain("keyword-placement");
  });
  it("title-length", () => {
    expect(rulesOf(goodPost({ title: `Sample keyword ${"x".repeat(60)}` }))).toContain("title-length");
  });
  it("description-length", () => {
    expect(rulesOf(goodPost({ description: "sample keyword" }))).toContain("description-length");
  });
  it("one-top-heading", () => {
    expect(rulesOf(goodPost({ body: `# Top\n\n${goodPost().body}` }))).toContain("one-top-heading");
  });
  it("known-category and known-author", () => {
    expect(rulesOf(goodPost({ category: "nope" }))).toContain("known-category");
    expect(rulesOf(goodPost({ author: "nobody" }))).toContain("known-author");
  });
  it("sources-are-links", () => {
    expect(rulesOf(goodPost({ body: `${goodPost().body}\n\nSee [here](https://example.com).` }))).toContain(
      "sources-are-links",
    );
    expect(
      rulesOf(goodPost({ body: `${goodPost().body}\n\nSee [the spec](http://example.com).` })),
    ).toContain("sources-are-links");
  });
  it("images-described", () => {
    expect(rulesOf(goodPost({ body: `${goodPost().body}\n\n![](/x.png)` }))).toContain("images-described");
  });
  it("honest-dates", () => {
    expect(rulesOf(goodPost({ publishedAt: "2999-01-01T00:00:00.000Z" }))).toContain("honest-dates");
    expect(rulesOf(goodPost({ updatedAt: "2025-01-01T00:00:00.000Z" }))).toContain("honest-dates");
  });
  it("answer-first", () => {
    expect(
      rulesOf(goodPost({ body: goodPost().body.replace(paragraph(42, "intro"), paragraph(5, "intro")) })),
    ).toContain("answer-first");
    expect(
      rulesOf(goodPost({ body: goodPost().body.replace(paragraph(30, "open0"), paragraph(80, "open0")) })),
    ).toContain("answer-first");
  });
  it("question-headings", () => {
    expect(rulesOf(goodPost({ body: goodPost().body.replace(/\?/g, "") }))).toContain("question-headings");
  });
  it("sections", () => {
    expect(
      rulesOf(
        goodPost({ body: goodPost().body.replace("## Sample keyword checklist", "### Not a section") }),
      ),
    ).toContain("sections");
  });
  it("minimum-length", () => {
    expect(rulesOf(goodPost({ body: goodPost().body.replace(paragraph(380, "body0"), "short.") }))).toContain(
      "minimum-length",
    );
    expect(
      rulesOf(
        goodPost({ length: "short", body: goodPost().body.replace(paragraph(380, "body0"), "short.") }),
      ),
    ).toEqual([]);
  });
  it("skips the live-only rules for a draft", () => {
    expect(rulesOf(goodPost({ draft: true, body: "A sample keyword draft." }))).toEqual([]);
  });
});

describe("checkPosts", () => {
  const second = (over: Partial<RulePost> = {}) =>
    goodPost({
      slug: "second-keyword-post",
      title: "Second Keyword: A Title",
      primaryKeyword: "second keyword",
      description:
        "A second keyword description that is long enough to satisfy the rule and mentions the second keyword with every main word in it here.",
      category: categories[1]!.slug,
      body: goodPost()
        .body.replace("A sample keyword opening", "A second keyword opening")
        .replace(/sample keyword/g, "second keyword")
        .replace(/Sample keyword/g, "Second keyword")
        .replace(/open(\d)/g, "sopen$1")
        .replace(/body(\d)/g, "sbody$1"),
      ...over,
    });
  const link = (post: RulePost, to: string) => ({
    ...post,
    body: `${post.body}\n\nRead [the other post](/blog/${to}).`,
  });
  const rules = (posts: RulePost[], full = true) =>
    checkPosts(posts, { ...ctx, full }).findings.map((f) => f.rule);

  it("passes two linked posts", () => {
    expect(
      checkPosts([link(goodPost(), "second-keyword-post"), link(second(), "sample-keyword-post")], {
        ...ctx,
        full: true,
      }).findings,
    ).toEqual([]);
  });
  it("unique-slugs and one-owner-per-keyword", () => {
    expect(rules([goodPost(), goodPost()], false)).toContain("unique-slugs");
    expect(
      rules(
        [
          goodPost(),
          second({
            primaryKeyword: "sample keyword",
            title: "Sample Keyword Again",
            slug: "sample-keyword-again",
            description: goodPost().description,
          }),
        ],
        false,
      ),
    ).toContain("one-owner-per-keyword");
    expect(
      checkPosts([goodPost()], {
        ...ctx,
        full: true,
        keywordMap: [{ keyword: "unwritten keyword", slug: "unwritten" }],
      }).findings.map((f) => f.rule),
    ).toContain("one-owner-per-keyword");
  });
  it("distinct-headings", () => {
    expect(
      rules(
        [
          goodPost(),
          second({ body: goodPost().body.replace("A sample keyword opening", "A second keyword opening") }),
        ],
        false,
      ),
    ).toContain("distinct-headings");
  });
  it("no-repeated-sections", () => {
    const copy = second({
      body: goodPost()
        .body.replace("A sample keyword opening", "A second keyword opening")
        .replace(/## (.*)/g, "## Other $1"),
    });
    expect(rules([goodPost(), copy], false)).toContain("no-repeated-sections");
  });
  it("links-resolve", () => {
    expect(rules([link(goodPost(), "nowhere")], false)).toContain("links-resolve");
    expect(rules([{ ...goodPost(), body: `${goodPost().body}\n\n[nope](/nope)` }], false)).toContain(
      "links-resolve",
    );
    expect(
      rules(
        [
          { ...goodPost(), body: `${goodPost().body}\n\n[anchor](/blog/second-keyword-post#missing)` },
          second(),
        ],
        false,
      ),
    ).toContain("links-resolve");
  });
  it("no-orphans", () => {
    const third = second({
      slug: "third-keyword-post",
      title: "Third Keyword: A Title",
      primaryKeyword: "third keyword",
      description: second().description.replace(/second/g, "third"),
      body: second()
        .body.replace(/second keyword/g, "third keyword")
        .replace(/Second keyword/g, "Third keyword")
        .replace(/sopen/g, "topen")
        .replace(/sbody/g, "tbody"),
    });
    expect(
      rules([link(goodPost(), "second-keyword-post"), link(second(), "sample-keyword-post"), third]),
    ).toContain("no-orphans");
  });
  it("balanced-categories", () => {
    const posts = [goodPost(), second()];
    const findings = checkPosts(
      [
        ...posts,
        ...[1, 2, 3].map((i) =>
          goodPost({
            slug: `sample-keyword-post-${i}`,
            title: `Sample Keyword ${i}`,
            primaryKeyword: `sample keyword ${i}`,
            description: `${goodPost().description} ${i}`,
            body: goodPost()
              .body.replace(/## (.*)/g, `## ${i} $1`)
              .replace(/body(\d)/g, `b${i}ody$1`),
          }),
        ),
      ],
      { ...ctx, full: true },
    ).findings.map((f) => f.rule);
    expect(findings).toContain("balanced-categories");
  });
});
