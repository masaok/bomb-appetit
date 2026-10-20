import { countWords, parseBody, slugifyHeading, type ParsedBody } from "./markdown";
import { BLOG_PATH, CATEGORY_PATH, RECENT_PATH, RESERVED_SLUGS, SITE_PATHS, UPDATED_PATH } from "./routes";
import type { Author, Category } from "./schema";

export const MIN_POST_WORDS = 1500;
export const MIN_SHORT_POST_WORDS = 800;
export const MIN_ANSWER_WORDS = 40;
export const MAX_ANSWER_WORDS = 60;
export const MIN_QUESTION_HEADINGS = 2;
export const MIN_POST_SECTIONS = 4;
export const MAX_POST_SECTIONS = 8;
export const MAX_TITLE = 60;
export const MIN_DESCRIPTION = 120;
export const MAX_DESCRIPTION = 160;
export const OVERLAP_SEQUENCE_WORDS = 5;
export const MAX_SECTION_OVERLAP_PERCENT = 20;
export const MIN_CATEGORIES = 2;
export const MIN_POSTS_PER_CATEGORY = 2;
export const MAX_CATEGORY_RATIO = 2;
export const MIN_POSTS_TO_BALANCE = MIN_CATEGORIES * MIN_POSTS_PER_CATEGORY;

export type RulePost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  primaryKeyword: string;
  length: "full" | "short";
  author: string;
  draft: boolean;
  body: string;
  createdAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export type Finding = { slug: string; rule: string; message: string };

export type RuleContext = {
  categories: Category[];
  authors: Author[];
  /** Run the whole-blog rules (balance, orphans, every mapped keyword has a post). */
  full: boolean;
  /** Slugs links may point at beyond the posts given: the keyword map in subset mode. */
  plannedSlugs?: string[];
  /** keyword -> slug, from docs/blog-keywords.md. */
  keywordMap?: { keyword: string; slug: string }[];
  now?: Date;
};

const STOP = new Set(
  "a an and are as at be by can do does for from how i in is it its me my of on or our the their this to vs what when where which who why with you your".split(
    " ",
  ),
);

const stem = (w: string) =>
  w
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(ing|ed|es|s)$/, "");
const words = (text: string) => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
export const mainWords = (keyword: string) => words(keyword).filter((w) => !STOP.has(w));

function hasAllWords(keyword: string, text: string): string[] {
  const have = new Set(words(text).map(stem));
  return mainWords(keyword).filter((w) => !have.has(stem(w)));
}

const normalizeHeading = (h: string) =>
  h
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function grams(text: string): Set<string> {
  const w = words(text);
  const out = new Set<string>();
  for (let i = 0; i + OVERLAP_SEQUENCE_WORDS <= w.length; i++)
    out.add(w.slice(i, i + OVERLAP_SEQUENCE_WORDS).join(" "));
  return out;
}

const VAGUE_LINK_TEXT = /^(here|click here|source|link|this|this page|read more|more)$/i;

/** Rules one post must pass on its own. The write function runs these before every save. */
export function checkPost(post: RulePost, ctx: RuleContext, parsed = parseBody(post.body)): Finding[] {
  const out: Finding[] = [];
  const fail = (rule: string, message: string) => out.push({ slug: post.slug, rule, message });
  const live = !post.draft;
  const now = ctx.now ?? new Date();

  if (RESERVED_SLUGS.includes(post.slug))
    fail("reserved-slug", `"${post.slug}" belongs to a fixed route under ${BLOG_PATH}`);

  const kw = post.primaryKeyword.toLowerCase();
  if (!post.title.toLowerCase().includes(kw))
    fail("keyword-placement", `title does not contain "${post.primaryKeyword}"`);
  if (!post.slug.includes(slugifyHeading(kw)))
    fail("keyword-placement", `slug does not contain "${slugifyHeading(kw)}"`);
  const missingDesc = hasAllWords(kw, post.description);
  if (missingDesc.length) fail("keyword-placement", `description is missing: ${missingDesc.join(", ")}`);
  const missingFirst = hasAllWords(kw, parsed.firstParagraph);
  if (missingFirst.length)
    fail("keyword-placement", `first paragraph is missing: ${missingFirst.join(", ")}`);

  if (post.title.length > MAX_TITLE)
    fail("title-length", `title is ${post.title.length} characters, max ${MAX_TITLE}`);
  const d = post.description.length;
  if (d < MIN_DESCRIPTION || d > MAX_DESCRIPTION)
    fail(
      "description-length",
      `description is ${d} characters, needs ${MIN_DESCRIPTION} to ${MAX_DESCRIPTION}`,
    );

  if (parsed.topLevelHeadings > 0) fail("one-top-heading", "body has its own top-level heading");

  if (!ctx.categories.some((c) => c.slug === post.category))
    fail("known-category", `unknown category "${post.category}"`);
  const author = ctx.authors.find((a) => a.slug === post.author);
  if (!author) fail("known-author", `unknown author "${post.author}"`);
  else if (!author.url) fail("known-author", `author "${author.slug}" has no url`);

  for (const link of parsed.links) {
    if (/^https?:\/\//.test(link.href)) {
      if (!link.href.startsWith("https://"))
        fail("sources-are-links", `external link is not https: ${link.href}`);
      const text = link.text.trim();
      if (VAGUE_LINK_TEXT.test(text) || /^https?:\/\//.test(text) || /^www\./.test(text))
        fail("sources-are-links", `link text "${text}" does not say what is on the other side`);
    }
  }
  for (const image of parsed.images)
    if (!image.alt.trim()) fail("images-described", `image ${image.src} has no alt text`);

  // publishedAt is the author's date and may precede createdAt, the row's insert time.
  const published = post.publishedAt ? new Date(post.publishedAt) : null;
  const updated = post.updatedAt ? new Date(post.updatedAt) : null;
  if (live && published && published > now) fail("honest-dates", "publishedAt is in the future");
  if (updated && published && updated < published) fail("honest-dates", "updatedAt is before publishedAt");
  if (updated && updated > now) fail("honest-dates", "updatedAt is in the future");

  if (!live) return out;

  const answer = countWords(parsed.firstParagraph);
  if (answer < MIN_ANSWER_WORDS || answer > MAX_ANSWER_WORDS)
    fail(
      "answer-first",
      `opening paragraph is ${answer} words, needs ${MIN_ANSWER_WORDS} to ${MAX_ANSWER_WORDS}`,
    );
  for (const s of parsed.sections) {
    const n = s.opener ? countWords(s.opener) : 0;
    if (n > MAX_ANSWER_WORDS)
      fail("answer-first", `section "${s.heading.text}" opens with ${n} words, max ${MAX_ANSWER_WORDS}`);
  }

  const questions = parsed.headings.filter((h) => h.text.trim().endsWith("?")).length;
  if (questions < MIN_QUESTION_HEADINGS)
    fail(
      "question-headings",
      `${questions} second-level headings are questions, needs ${MIN_QUESTION_HEADINGS}`,
    );

  const n = parsed.headings.length;
  if (n < MIN_POST_SECTIONS || n > MAX_POST_SECTIONS)
    fail("sections", `${n} second-level headings, needs ${MIN_POST_SECTIONS} to ${MAX_POST_SECTIONS}`);
  const ids = parsed.headings.map((h) => h.id);
  const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupIds.length) fail("sections", `headings share an anchor: ${[...new Set(dupIds)].join(", ")}`);

  const floor = post.length === "short" ? MIN_SHORT_POST_WORDS : MIN_POST_WORDS;
  const wordCount = countWords(parsed.prose);
  if (wordCount < floor) fail("minimum-length", `${wordCount} prose words, floor is ${floor}`);

  return out;
}

export type Report = {
  findings: Finding[];
  perCategory: { slug: string; name: string; published: number }[];
  perPost: {
    slug: string;
    category: string;
    words: number;
    floor: number;
    answerWords: number;
    answer: string;
    linkedFrom: string[];
    maxOverlap: { percent: number; with: string } | null;
  }[];
};

/** Every rule over a set of posts: per-post rules plus the rules that compare posts. */
export function checkPosts(posts: RulePost[], ctx: RuleContext): Report {
  const findings: Finding[] = [];
  const parsed = new Map(posts.map((p) => [p.slug, parseBody(p.body)]));
  const live = posts.filter((p) => !p.draft);

  for (const p of posts) findings.push(...checkPost(p, ctx, parsed.get(p.slug)!));

  // Unique slugs and one owner per keyword
  const seenSlug = new Map<string, number>();
  const seenKeyword = new Map<string, string>();
  for (const p of posts) {
    seenSlug.set(p.slug, (seenSlug.get(p.slug) ?? 0) + 1);
    const kw = p.primaryKeyword.toLowerCase();
    const owner = seenKeyword.get(kw);
    if (owner && owner !== p.slug)
      findings.push({
        slug: p.slug,
        rule: "one-owner-per-keyword",
        message: `"${p.primaryKeyword}" is also the primary keyword of ${owner}`,
      });
    else seenKeyword.set(kw, p.slug);
  }
  for (const [slug, count] of seenSlug)
    if (count > 1) findings.push({ slug, rule: "unique-slugs", message: `${count} posts use this slug` });
  if (ctx.full && ctx.keywordMap)
    for (const row of ctx.keywordMap)
      if (!seenKeyword.has(row.keyword.toLowerCase()))
        findings.push({
          slug: row.slug,
          rule: "one-owner-per-keyword",
          message: `mapped keyword "${row.keyword}" has no post`,
        });

  // Distinct headings across posts
  const headingOwner = new Map<string, string>();
  for (const p of live)
    for (const h of parsed.get(p.slug)!.headings) {
      const key = normalizeHeading(h.text);
      const owner = headingOwner.get(key);
      if (owner && owner !== p.slug)
        findings.push({
          slug: p.slug,
          rule: "distinct-headings",
          message: `heading "${h.text}" is also in ${owner}`,
        });
      else headingOwner.set(key, p.slug);
    }

  // Section overlap: index every 5-word sequence once, then count per other section
  const sectionGrams: { slug: string; heading: string; grams: Set<string> }[] = [];
  const index = new Map<string, number[]>();
  for (const p of live)
    for (const s of parsed.get(p.slug)!.sections) {
      const id = sectionGrams.length;
      const g = grams(s.prose);
      sectionGrams.push({ slug: p.slug, heading: s.heading.text, grams: g });
      for (const gram of g) {
        const list = index.get(gram);
        if (list) list.push(id);
        else index.set(gram, [id]);
      }
    }
  const maxOverlap = new Map<string, { percent: number; with: string }>();
  sectionGrams.forEach((section, id) => {
    if (section.grams.size === 0) return;
    const shared = new Map<number, number>();
    for (const gram of section.grams)
      for (const other of index.get(gram)!)
        if (other !== id && sectionGrams[other]!.slug !== section.slug)
          shared.set(other, (shared.get(other) ?? 0) + 1);
    for (const [other, count] of shared) {
      const percent = Math.round((count / section.grams.size) * 100);
      const best = maxOverlap.get(section.slug);
      if (!best || percent > best.percent)
        maxOverlap.set(section.slug, { percent, with: sectionGrams[other]!.slug });
      if (percent > MAX_SECTION_OVERLAP_PERCENT)
        findings.push({
          slug: section.slug,
          rule: "no-repeated-sections",
          message: `${percent}% of "${section.heading}" also appears in "${sectionGrams[other]!.heading}" (${sectionGrams[other]!.slug})`,
        });
    }
  });

  // Category list itself
  const catSlugs = ctx.categories.map((c) => c.slug);
  for (const slug of new Set(catSlugs.filter((s, i) => catSlugs.indexOf(s) !== i)))
    findings.push({ slug, rule: "known-category", message: "two categories share this slug" });

  // Links resolve
  const postSlugs = new Set([...posts.map((p) => p.slug), ...(ctx.plannedSlugs ?? [])]);
  const fixed = new Set([...SITE_PATHS, BLOG_PATH, RECENT_PATH, UPDATED_PATH]);
  const linkedFrom = new Map<string, Set<string>>();
  for (const p of posts) {
    for (const link of parsed.get(p.slug)!.links) {
      if (!link.href.startsWith("/")) continue;
      const [rawPath, anchor] = link.href.split("#");
      const clean = (rawPath ?? "").replace(/\/$/, "") || "/";
      if (clean.startsWith(`${CATEGORY_PATH}/`)) {
        if (!catSlugs.includes(clean.slice(CATEGORY_PATH.length + 1)))
          findings.push({
            slug: p.slug,
            rule: "links-resolve",
            message: `unknown category link ${link.href}`,
          });
        continue;
      }
      if (clean.startsWith(`${BLOG_PATH}/`) && !fixed.has(clean)) {
        const target = clean.slice(BLOG_PATH.length + 1);
        if (!postSlugs.has(target)) {
          findings.push({ slug: p.slug, rule: "links-resolve", message: `no post at ${link.href}` });
          continue;
        }
        const targetBody = parsed.get(target);
        if (anchor && targetBody && !targetBody.headings.some((h) => h.id === anchor))
          findings.push({
            slug: p.slug,
            rule: "links-resolve",
            message: `no heading #${anchor} in ${target}`,
          });
        if (target !== p.slug && !p.draft) {
          if (!linkedFrom.has(target)) linkedFrom.set(target, new Set());
          linkedFrom.get(target)!.add(p.slug);
        }
        continue;
      }
      if (!fixed.has(clean))
        findings.push({ slug: p.slug, rule: "links-resolve", message: `no page at ${link.href}` });
    }
  }

  // Whole-blog rules
  const perCategory = ctx.categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    published: live.filter((p) => p.category === c.slug).length,
  }));
  if (ctx.full) {
    if (live.length >= 3)
      for (const p of live)
        if (!linkedFrom.get(p.slug)?.size)
          findings.push({
            slug: p.slug,
            rule: "no-orphans",
            message: "no other published post links to this one",
          });
    if (live.length >= MIN_POSTS_TO_BALANCE) {
      const used = perCategory.filter((c) => c.published > 0);
      const counts = perCategory.map((c) => `${c.slug}=${c.published}`).join(", ");
      const min = Math.min(...used.map((c) => c.published));
      const max = Math.max(...used.map((c) => c.published));
      if (used.length < MIN_CATEGORIES)
        findings.push({
          slug: "*",
          rule: "balanced-categories",
          message: `only ${used.length} categories have posts (${counts})`,
        });
      if (min < MIN_POSTS_PER_CATEGORY)
        findings.push({
          slug: "*",
          rule: "balanced-categories",
          message: `a category has fewer than ${MIN_POSTS_PER_CATEGORY} posts (${counts})`,
        });
      if (max > min * MAX_CATEGORY_RATIO)
        findings.push({
          slug: "*",
          rule: "balanced-categories",
          message: `largest category is over ${MAX_CATEGORY_RATIO}x the smallest (${counts})`,
        });
    }
  }

  const perPost = posts.map((p) => {
    const b = parsed.get(p.slug)!;
    return {
      slug: p.slug,
      category: p.category,
      words: countWords(b.prose),
      floor: p.length === "short" ? MIN_SHORT_POST_WORDS : MIN_POST_WORDS,
      answerWords: countWords(b.firstParagraph),
      answer: b.firstParagraph,
      linkedFrom: [...(linkedFrom.get(p.slug) ?? [])].sort(),
      maxOverlap: maxOverlap.get(p.slug) ?? null,
    };
  });

  return { findings, perCategory, perPost };
}

export type { ParsedBody };
