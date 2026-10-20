import { revalidatePath } from "next/cache";
import { env } from "@/lib/server/env";
import { BLOG_PATH } from "@/lib/blog/routes";

/**
 * Expires every cached blog page, so a seed shows up without a deploy. Called by
 * `pnpm blog:seed` with the same bearer secret the cron routes use.
 */
export async function POST(req: Request) {
  const secret = env.cronSecret;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidatePath(BLOG_PATH, "layout");
  revalidatePath("/sitemap.xml");
  return Response.json({ ok: true });
}
