import type { Metadata } from "next";
import Link from "next/link";
import { BlogIntro, JsonLd } from "@/components/blog/parts";
import { blog, categories } from "@/lib/blog/config";
import { breadcrumbLd, crumbs } from "@/lib/blog/feeds";
import { listPublishedPosts } from "@/lib/blog/loader";
import { BLOG_PATH, RECENT_PATH, UPDATED_PATH, categoryPath } from "@/lib/blog/routes";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description: blog.description,
  alternates: { canonical: BLOG_PATH },
  openGraph: { title: blog.name, description: blog.description, url: BLOG_PATH, type: "website" },
};

const tileColors = ["bg-sun", "bg-sky", "bg-mint", "bg-blush"];

export default async function BlogIndex() {
  const posts = await listPublishedPosts();
  const cards = categories
    .map((c) => ({ ...c, count: posts.filter((p) => p.category === c.slug).length }))
    .filter((c) => c.count > 0);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-10 pb-24 lg:pt-16">
      <JsonLd data={breadcrumbLd([crumbs.index])} />
      <BlogIntro kicker="Blog" title="Reading for Defusers and Experts">
        <p>{blog.description}</p>
      </BlogIntro>
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-bold">
        <Link href={RECENT_PATH} className="text-tomato-text underline underline-offset-2 hover:text-ink">
          See the most recent posts
        </Link>
        <Link href={UPDATED_PATH} className="text-tomato-text underline underline-offset-2 hover:text-ink">
          See the most recently updated posts
        </Link>
      </p>
      {cards.length === 0 ? (
        <p className="mt-10 text-lg text-muted">No posts yet. Check back soon.</p>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <li key={c.slug}>
              <Link
                href={categoryPath(c.slug)}
                className="sticker sticker-press flex h-full flex-col rounded-2xl bg-card p-6"
              >
                <span
                  className={`inline-block w-fit rounded-full border-2 border-night px-3 py-0.5 text-xs font-extrabold text-night ${tileColors[i % tileColors.length]}`}
                >
                  {c.count} {c.count === 1 ? "post" : "posts"}
                </span>
                <h2 className="mt-4 font-display text-2xl font-semibold leading-tight">{c.name}</h2>
                <p className="mt-2 flex-1 leading-relaxed text-muted">{c.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
