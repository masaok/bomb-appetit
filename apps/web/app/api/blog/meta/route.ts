import { listPublishedPosts } from "@/lib/blog/loader";

export const dynamic = "force-dynamic";

/** The post count, for dashboards. Same list as the blog index and the sitemap. */
export async function GET() {
  try {
    const posts = await listPublishedPosts();
    return Response.json(
      {
        posts: posts.length,
        latest: posts[0]?.publishedAt ?? null,
        categories: new Set(posts.map((p) => p.category)).size,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    console.error("[blog/meta]", error);
    return Response.json({ error: "blog store unavailable" }, { status: 503 });
  }
}
