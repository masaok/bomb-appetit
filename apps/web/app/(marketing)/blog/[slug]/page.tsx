import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CallToActionBox } from "@/components/blog/cta";
import { Breadcrumb, JsonLd, formatDate } from "@/components/blog/parts";
import { TableOfContents } from "@/components/blog/toc";
import { authorOf, blogPostingLd, breadcrumbLd, categoryOf, crumbs } from "@/lib/blog/feeds";
import { getPublishedPost, listPublishedPosts } from "@/lib/blog/loader";
import { parseBody, renderBody } from "@/lib/blog/markdown";
import {
  BLOG_PATH,
  RELATED_POST_COUNT,
  categoryPath,
  postImagePath,
  postMarkdownPath,
  postPath,
} from "@/lib/blog/routes";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listPublishedPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return {};
  const image = post.image ?? postImagePath(post.slug);
  const author = authorOf(post.author);
  return {
    title: post.title,
    description: post.description,
    keywords: [post.primaryKeyword, ...post.secondaryKeywords],
    authors: [{ name: author.name, url: author.url }],
    alternates: {
      canonical: postPath(post.slug),
      types: { "text/markdown": postMarkdownPath(post.slug) },
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: postPath(post.slug),
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const category = categoryOf(post.category);
  const author = authorOf(post.author);
  const { headings, links } = parseBody(post.body);
  const html = renderBody(post.body);

  // Related: same category, the ones this post links to first, then the newest
  const linked = new Set(
    links.map((l) => l.href.split("#")[0]).filter((h) => h?.startsWith(`${BLOG_PATH}/`)),
  );
  const siblings = (await listPublishedPosts()).filter(
    (p) => p.category === post.category && p.slug !== post.slug,
  );
  const related = [
    ...siblings.filter((p) => linked.has(postPath(p.slug))),
    ...siblings.filter((p) => !linked.has(postPath(p.slug))),
  ].slice(0, RELATED_POST_COUNT);

  return (
    <article className="mx-auto max-w-6xl px-6 pt-10 pb-24 lg:pt-16">
      <JsonLd data={blogPostingLd(post)} />
      <JsonLd
        data={breadcrumbLd([
          crumbs.index,
          crumbs.category(post.category),
          { name: post.title, path: postPath(post.slug) },
        ])}
      />
      <Breadcrumb
        items={[
          { name: "Blog", href: BLOG_PATH },
          ...(category ? [{ name: category.name, href: categoryPath(category.slug) }] : []),
          { name: post.title },
        ]}
      />
      <header className="mt-6 max-w-3xl">
        {category && (
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-tomato-text">
            {category.name}
          </p>
        )}
        <h1 className="mt-2 font-display text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>
            By{" "}
            <a href={author.url} className="font-bold text-tomato-text hover:underline">
              {author.name}
            </a>
          </span>
          <span>Published {formatDate(post.publishedAt)}</span>
          {post.updatedAt && <span>Updated {formatDate(post.updatedAt)}</span>}
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <aside className="lg:order-2">
          <div className="space-y-6 lg:sticky lg:top-6">
            <details
              open
              className="group max-lg:rounded-2xl max-lg:border-2 max-lg:border-line max-lg:bg-card max-lg:p-4 max-lg:shadow-[4px_4px_0_var(--shadow)]"
            >
              <summary className="cursor-pointer list-none font-display text-lg font-semibold lg:hidden">
                Contents
              </summary>
              <div className="mt-3 lg:mt-0">
                <TableOfContents headings={headings} />
              </div>
            </details>
            <CallToActionBox id="cta-sidebar" />
          </div>
        </aside>

        <div className="min-w-0 lg:order-1">
          <div className="post-body max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
          <div className="mt-12 max-w-3xl">
            <CallToActionBox id="cta-end" />
          </div>
          {related.length > 0 && category && (
            <section aria-labelledby="related" className="mt-12 max-w-3xl">
              <h2 id="related" className="font-display text-2xl font-semibold">
                Related posts
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={postPath(p.slug)}
                      className="sticker sticker-press block h-full rounded-2xl bg-card p-4"
                    >
                      <span className="font-display text-lg font-semibold leading-tight">{p.title}</span>
                      <span className="mt-1 block text-sm text-muted">{p.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-5">
                <Link
                  href={categoryPath(category.slug)}
                  className="font-bold text-tomato-text underline underline-offset-2 hover:text-ink"
                >
                  All posts in {category.name}
                </Link>
              </p>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
