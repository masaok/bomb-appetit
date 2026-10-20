import { llmsTxt } from "@/lib/blog/feeds";
import { listPublishedPosts } from "@/lib/blog/loader";

export const revalidate = 3600;

export async function GET() {
  return new Response(llmsTxt(await listPublishedPosts()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
