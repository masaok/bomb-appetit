import type { Metadata } from "next";
import Link from "next/link";
import { BlogIntro, Breadcrumb, JsonLd, PostList } from "@/components/blog/parts";
import { blog } from "@/lib/blog/config";
import { breadcrumbLd, crumbs } from "@/lib/blog/feeds";
import { listPublishedPosts } from "@/lib/blog/loader";
import { BLOG_PATH, RECENT_PATH, RECENT_POST_LIMIT, UPDATED_PATH } from "@/lib/blog/routes";

export const revalidate = 3600;

const title = "Recent posts";
const description = `The newest posts from every category of the ${blog.name}, most recent first.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: RECENT_PATH },
  openGraph: { title, description, url: RECENT_PATH },
};

export default async function RecentPosts() {
  const posts = (await listPublishedPosts()).slice(0, RECENT_POST_LIMIT);
  return (
    <div className="mx-auto max-w-3xl px-6 pt-10 pb-24 lg:pt-16">
      <JsonLd data={breadcrumbLd([crumbs.index, { name: "Recent posts", path: RECENT_PATH }])} />
      <Breadcrumb items={[{ name: "Blog", href: BLOG_PATH }, { name: "Recent posts" }]} />
      <div className="mt-6">
        <BlogIntro kicker="Blog" title="Recent posts">
          <p>The newest posts from every category, most recent first.</p>
        </BlogIntro>
      </div>
      <p className="mt-4 font-bold">
        <Link href={UPDATED_PATH} className="text-tomato-text underline underline-offset-2 hover:text-ink">
          See the most recently updated posts
        </Link>
      </p>
      <div className="mt-8">
        {posts.length ? <PostList posts={posts} /> : <p className="text-muted">No posts yet.</p>}
      </div>
    </div>
  );
}
