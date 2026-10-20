import { postMarkdown } from "@/lib/blog/feeds";
import { getPublishedPost, listPublishedPosts } from "@/lib/blog/loader";

export const revalidate = 3600;

// Served at /blog/<slug>.md through the rewrite in next.config.ts
export async function generateStaticParams() {
  return (await listPublishedPosts()).map((p) => ({ slug: p.slug }));
}

export async function GET(_req: Request, { params }: RouteContext<"/blog/md/[slug]">) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post)
    return new Response("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  return new Response(postMarkdown(post), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
