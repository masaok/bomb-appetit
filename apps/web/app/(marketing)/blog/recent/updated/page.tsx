import type { Metadata } from "next";
import { BlogIntro, Breadcrumb, JsonLd, PostList } from "@/components/blog/parts";
import { blog } from "@/lib/blog/config";
import { breadcrumbLd, crumbs } from "@/lib/blog/feeds";
import { listPublishedPosts } from "@/lib/blog/loader";
import { BLOG_PATH, RECENT_PATH, RECENT_POST_LIMIT, UPDATED_PATH } from "@/lib/blog/routes";

export const revalidate = 3600;

const title = "Recently updated posts";
const description = `Posts from the ${blog.name} that were revised after they were published, latest revision first.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: UPDATED_PATH },
  openGraph: { title, description, url: UPDATED_PATH },
};

export default async function UpdatedPosts() {
  const posts = (await listPublishedPosts())
    .filter((p) => p.updatedAt)
    .sort((a, b) => b.updatedAt!.localeCompare(a.updatedAt!))
    .slice(0, RECENT_POST_LIMIT);
  return (
    <div className="mx-auto max-w-3xl px-6 pt-10 pb-24 lg:pt-16">
      <JsonLd
        data={breadcrumbLd([
          crumbs.index,
          { name: "Recent posts", path: RECENT_PATH },
          { name: "Recently updated", path: UPDATED_PATH },
        ])}
      />
      <Breadcrumb
        items={[
          { name: "Blog", href: BLOG_PATH },
          { name: "Recent posts", href: RECENT_PATH },
          { name: "Recently updated" },
        ]}
      />
      <div className="mt-6">
        <BlogIntro kicker="Blog" title="Recently updated posts">
          <p>
            A post is marked updated only when what it says has changed, not for a typo fix. Latest revision
            first.
          </p>
        </BlogIntro>
      </div>
      <div className="mt-8">
        {posts.length ? (
          <PostList posts={posts} showUpdated />
        ) : (
          <p className="text-muted">No post has been revised since it was published yet.</p>
        )}
      </div>
    </div>
  );
}
