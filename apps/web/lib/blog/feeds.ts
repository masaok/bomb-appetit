import { GITHUB_URL } from "@/components/marketing/links";
import { SITE_NAME, SITE_URL, authors, blog, categories } from "./config";
import { BLOG_PATH, FEED_PATH, categoryPath, postImagePath, postMarkdownPath, postPath } from "./routes";
import type { Post, PostSummary } from "./schema";

export const absolute = (path: string) => new URL(path, SITE_URL).toString();
export const authorOf = (slug: string) => authors.find((a) => a.slug === slug) ?? authors[0]!;
export const categoryOf = (slug: string) => categories.find((c) => c.slug === slug);
export const lastChanged = (p: PostSummary) => p.updatedAt ?? p.publishedAt;

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function atomFeed(posts: PostSummary[]): string {
  const updated = posts.map(lastChanged).sort().at(-1) ?? new Date(0).toISOString();
  const entries = posts.map((p) => {
    const url = absolute(postPath(p.slug));
    return `  <entry>
    <title>${xml(p.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <published>${p.publishedAt}</published>
    <updated>${lastChanged(p)}</updated>
    <author><name>${xml(authorOf(p.author).name)}</name></author>
    <category term="${xml(p.category)}"/>
    <summary>${xml(p.description)}</summary>
  </entry>`;
  });
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xml(blog.name)}</title>
  <subtitle>${xml(blog.description)}</subtitle>
  <link href="${absolute(FEED_PATH)}" rel="self"/>
  <link href="${absolute(BLOG_PATH)}"/>
  <id>${absolute(BLOG_PATH)}</id>
  <updated>${updated}</updated>
${entries.join("\n")}
</feed>
`;
}

export function llmsTxt(posts: PostSummary[]): string {
  const lines = [
    `# ${blog.name}`,
    "",
    `> ${blog.description}`,
    "",
    `Every post has a plain Markdown copy at its URL plus \`.md\`. Site: ${SITE_URL}`,
  ];
  for (const c of categories) {
    const inCat = posts.filter((p) => p.category === c.slug);
    if (!inCat.length) continue;
    lines.push("", `## ${c.name}`, "", c.description, "");
    for (const p of inCat)
      lines.push(`- [${p.title}](${absolute(postMarkdownPath(p.slug))}): ${p.description}`);
  }
  return `${lines.join("\n")}\n`;
}

export function postMarkdown(p: Post): string {
  const author = authorOf(p.author);
  const meta = [
    `# ${p.title}`,
    "",
    `- Author: ${author.name} (${author.url})`,
    `- Published: ${p.publishedAt.slice(0, 10)}`,
    ...(p.updatedAt ? [`- Updated: ${p.updatedAt.slice(0, 10)}`] : []),
    `- Category: ${categoryOf(p.category)?.name ?? p.category}`,
    `- Canonical: ${absolute(postPath(p.slug))}`,
    "",
    `> ${p.description}`,
    "",
  ];
  return `${meta.join("\n")}${p.body}\n`;
}

type Crumb = { name: string; path: string };

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absolute(c.path),
    })),
  };
}

export function blogPostingLd(p: Post) {
  const author = authorOf(p.author);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.description,
    datePublished: p.publishedAt,
    dateModified: lastChanged(p),
    image: absolute(p.image ?? postImagePath(p.slug)),
    mainEntityOfPage: absolute(postPath(p.slug)),
    keywords: [p.primaryKeyword, ...p.secondaryKeywords].join(", "),
    articleSection: categoryOf(p.category)?.name,
    author: {
      "@type": author.kind === "person" ? "Person" : "Organization",
      name: author.name,
      url: author.url,
      sameAs: author.sameAs,
    },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL, sameAs: [GITHUB_URL] },
  };
}

export const crumbs = {
  index: { name: "Blog", path: BLOG_PATH },
  category: (slug: string) => ({ name: categoryOf(slug)?.name ?? slug, path: categoryPath(slug) }),
};
