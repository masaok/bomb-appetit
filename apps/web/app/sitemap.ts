import type { MetadataRoute } from "next";
import { categories } from "@/lib/blog/config";
import { absolute, lastChanged } from "@/lib/blog/feeds";
import { listPublishedPosts } from "@/lib/blog/loader";
import { BLOG_PATH, RECENT_PATH, UPDATED_PATH, categoryPath, postPath } from "@/lib/blog/routes";
import { cloud } from "@/lib/cloud";
import { MARKETING_ROUTES } from "@/lib/cloud-contract";

const gamePaths = ["/play", "/missions", "/leaderboard", "/manual/1"];

// Only the marketing pages this build has: the stub serves `/` and nothing else.
const paths = [...MARKETING_ROUTES.filter((route) => cloud.marketing[route] !== null), ...gamePaths];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPublishedPosts();
  const newest = (list: typeof posts) => list.map(lastChanged).sort().at(-1);
  const updated = posts.filter((p) => p.updatedAt);
  return [
    ...paths.map((path) => ({
      url: absolute(path),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : path === "/play" ? 0.9 : 0.7,
    })),
    ...(posts.length
      ? [
          { url: absolute(BLOG_PATH), lastModified: newest(posts) },
          { url: absolute(RECENT_PATH), lastModified: newest(posts) },
          ...(updated.length ? [{ url: absolute(UPDATED_PATH), lastModified: newest(updated) }] : []),
          ...categories
            .map((c) => ({ c, inCat: posts.filter((p) => p.category === c.slug) }))
            .filter(({ inCat }) => inCat.length > 0)
            .map(({ c, inCat }) => ({ url: absolute(categoryPath(c.slug)), lastModified: newest(inCat) })),
          ...posts.map((p) => ({ url: absolute(postPath(p.slug)), lastModified: lastChanged(p) })),
        ]
      : []),
  ];
}
