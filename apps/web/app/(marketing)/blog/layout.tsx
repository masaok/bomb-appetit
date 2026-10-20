import type { Metadata } from "next";
import type { ReactNode } from "react";
import { blog } from "@/lib/blog/config";
import { FEED_PATH } from "@/lib/blog/routes";
import "./blog.css";

export const metadata: Metadata = {
  alternates: { types: { "application/atom+xml": [{ url: FEED_PATH, title: blog.name }] } },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
