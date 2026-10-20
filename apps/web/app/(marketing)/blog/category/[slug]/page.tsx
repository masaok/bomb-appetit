import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIntro, Breadcrumb, JsonLd, PostList } from "@/components/blog/parts";
import { categories } from "@/lib/blog/config";
import { breadcrumbLd, categoryOf, crumbs } from "@/lib/blog/feeds";
import { listPublishedPosts } from "@/lib/blog/loader";
import { BLOG_PATH, categoryPath } from "@/lib/blog/routes";

export const revalidate = 3600;

async function postsIn(slug: string) {
  return (await listPublishedPosts()).filter((p) => p.category === slug);
}

export async function generateStaticParams() {
  const posts = await listPublishedPosts();
  return categories.filter((c) => posts.some((p) => p.category === c.slug)).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryOf(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: categoryPath(slug) },
    openGraph: { title: category.name, description: category.description, url: categoryPath(slug) },
  };
}

export default async function CategoryPage({ params }: PageProps<"/blog/category/[slug]">) {
  const { slug } = await params;
  const category = categoryOf(slug);
  const posts = category ? await postsIn(slug) : [];
  if (!category || posts.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 pt-10 pb-24 lg:pt-16">
      <JsonLd data={breadcrumbLd([crumbs.index, crumbs.category(slug)])} />
      <Breadcrumb items={[{ name: "Blog", href: BLOG_PATH }, { name: category.name }]} />
      <div className="mt-6">
        <BlogIntro kicker="Category" title={category.name}>
          <p>{category.intro}</p>
        </BlogIntro>
      </div>
      <div className="mt-8">
        <PostList posts={posts} showCategory={false} showTags />
      </div>
    </div>
  );
}
