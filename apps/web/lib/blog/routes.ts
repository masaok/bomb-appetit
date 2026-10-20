export const BLOG_PATH = "/blog";
export const RECENT_PATH = `${BLOG_PATH}/recent`;
export const UPDATED_PATH = `${RECENT_PATH}/updated`;
export const CATEGORY_PATH = `${BLOG_PATH}/category`;
export const FEED_PATH = `${BLOG_PATH}/feed.xml`;
export const LLMS_PATH = `${BLOG_PATH}/llms.txt`;
export const RECENT_POST_LIMIT = 100;
export const RELATED_POST_COUNT = 4;

/** Segments fixed routes under /blog own, so no post may use them as a slug. */
export const RESERVED_SLUGS = ["recent", "category", "feed.xml", "llms.txt", "md", "og"];

export const postPath = (slug: string) => `${BLOG_PATH}/${slug}`;
export const postMarkdownPath = (slug: string) => `${BLOG_PATH}/${slug}.md`;
export const postImagePath = (slug: string) => `${BLOG_PATH}/og/${slug}`;
export const categoryPath = (slug: string) => `${CATEGORY_PATH}/${slug}`;

/** Site pages outside the blog that a post may link to. */
export const SITE_PATHS = [
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
