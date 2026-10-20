import { ImageResponse } from "next/og";
import { blog } from "@/lib/blog/config";
import { categoryOf } from "@/lib/blog/feeds";
import { getPublishedPost, listPublishedPosts } from "@/lib/blog/loader";

export const revalidate = 3600;

// The social preview image for a post without its own: the title on the site's colors
export async function generateStaticParams() {
  return (await listPublishedPosts()).map((p) => ({ slug: p.slug }));
}

export async function GET(_req: Request, { params }: RouteContext<"/blog/og/[slug]">) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  const { background, foreground, accent } = blog.image;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background,
        color: foreground,
      }}
    >
      <div style={{ display: "flex", fontSize: 30, color: accent, fontWeight: 700 }}>
        {categoryOf(post.category)?.name ?? blog.name}
      </div>
      <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>{post.title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: accent }} />
        bombappetit.com
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
