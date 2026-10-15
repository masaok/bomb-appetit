import type { MetadataRoute } from "next";
import { cloud } from "@/lib/cloud";
import { MARKETING_ROUTES } from "@/lib/cloud-contract";

const BASE_URL = "https://bombappetit.com";

const gamePaths = ["/play", "/missions", "/leaderboard", "/manual/1"];

// Only the marketing pages this build has: the stub serves `/` and nothing else.
const paths = [...MARKETING_ROUTES.filter((route) => cloud.marketing[route] !== null), ...gamePaths];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: path === "/" ? BASE_URL : `${BASE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : path === "/play" ? 0.9 : 0.7,
  }));
}
