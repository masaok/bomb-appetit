import { z } from "zod";

// The shape a post must have to be saved. Length and wording rules live in
// rules.ts so the content check can report every failure at once.
export const postInputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase words joined by hyphens"),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string().min(1)).default([]),
  length: z.enum(["full", "short"]),
  tags: z.array(z.string().min(1)).min(2).max(4),
  author: z.string().min(1),
  image: z.string().nullish(),
  draft: z.boolean().default(false),
  createdAt: z.iso.datetime({ offset: true }).nullish(),
  publishedAt: z.iso.datetime({ offset: true }).nullish(),
  updatedAt: z.iso.datetime({ offset: true }).nullish(),
  body: z.string().min(1),
});

export type PostInput = z.infer<typeof postInputSchema>;

/** A post as the pages see it: dates are ISO strings so it serializes cleanly. */
export type Post = Omit<PostInput, "createdAt" | "publishedAt" | "updatedAt"> & {
  createdAt: string;
  publishedAt: string;
  updatedAt: string | null;
};

export type PostSummary = Omit<Post, "body">;

export type Category = {
  slug: string;
  name: string;
  description: string;
  intro: string;
};

export type Author = {
  slug: string;
  name: string;
  kind: "person" | "organization";
  bio: string;
  url: string;
  sameAs: string[];
};

export type CallToAction = {
  heading: string;
  body: string;
  label: string;
  href: string;
};
