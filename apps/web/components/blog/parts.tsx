import Link from "next/link";
import type { ReactNode } from "react";
import { categoryOf } from "@/lib/blog/feeds";
import { categoryPath, postPath } from "@/lib/blog/routes";
import type { PostSummary } from "@/lib/blog/schema";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function Breadcrumb({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-tomato-text">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function BlogIntro({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="max-w-3xl">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-tomato-text">
        {kicker}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
        {title}
      </h1>
      {children && <div className="mt-4 text-lg leading-relaxed text-muted">{children}</div>}
    </header>
  );
}

type ListOptions = { showCategory?: boolean; showTags?: boolean; showUpdated?: boolean };

export function PostList({
  posts,
  showCategory = true,
  showTags = false,
  showUpdated = false,
}: { posts: PostSummary[] } & ListOptions) {
  return (
    <ol className="divide-y-2 divide-line/15 border-y-2 border-line/15">
      {posts.map((p) => {
        const category = categoryOf(p.category);
        return (
          <li key={p.slug} className="py-6">
            <h2 className="font-display text-2xl font-semibold leading-tight">
              <Link href={postPath(p.slug)} className="hover:text-tomato-text">
                {p.title}
              </Link>
            </h2>
            <p className="mt-2 leading-relaxed text-muted">{p.description}</p>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {showUpdated && p.updatedAt && <span>Updated {formatDate(p.updatedAt)}</span>}
              <span>Published {formatDate(p.publishedAt)}</span>
              {showCategory && category && (
                <Link
                  href={categoryPath(category.slug)}
                  className="font-bold text-tomato-text hover:underline"
                >
                  {category.name}
                </Link>
              )}
              {showTags &&
                p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border-2 border-line/20 bg-card px-2.5 py-0.5 text-xs font-bold"
                  >
                    {t}
                  </span>
                ))}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
