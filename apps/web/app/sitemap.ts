import type { MetadataRoute } from "next";

const BASE_URL = "https://bombappetit.com";

const paths = [
  "/",
  "/play",
  "/how-to-play",
  "/missions",
  "/leaderboard",
  "/manual/1",
  "/faq",
  "/press",
  "/changelog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: path === "/" ? BASE_URL : `${BASE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : path === "/play" ? 0.9 : 0.7,
  }));
}
