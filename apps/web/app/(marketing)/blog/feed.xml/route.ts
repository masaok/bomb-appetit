import { atomFeed } from "@/lib/blog/feeds";
import { listPublishedPosts } from "@/lib/blog/loader";

export const revalidate = 3600;

export async function GET() {
  return new Response(atomFeed(await listPublishedPosts()), {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
