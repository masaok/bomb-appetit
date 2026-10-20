# The blog

The Bomb Appétit blog lives at `/blog`. This is the living document for the next agent: where things are, how they fit, how to add to them, and what the check enforces.

## Routes

| Route                       | Serves                                                                                                                                           | Code                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `/blog`                     | Index: one card per category with name, description and post count, links to both lists. No post list.                                           | `app/(marketing)/blog/page.tsx`                 |
| `/blog/recent`              | The 100 most recently published posts, newest first.                                                                                             | `app/(marketing)/blog/recent/page.tsx`          |
| `/blog/recent/updated`      | Posts with an `updatedAt`, latest revision first.                                                                                                | `app/(marketing)/blog/recent/updated/page.tsx`  |
| `/blog/category/<slug>`     | One category: intro, then its posts newest first with tags. Unknown slug: 404.                                                                   | `app/(marketing)/blog/category/[slug]/page.tsx` |
| `/blog/<slug>`              | One post: breadcrumb, byline, sticky table of contents with the call to action under it, body, call to action, related posts. Unknown slug: 404. | `app/(marketing)/blog/[slug]/page.tsx`          |
| `/blog/<slug>.md`           | The Markdown copy (rewrite to `/blog/md/<slug>` in `next.config.ts`).                                                                            | `app/(marketing)/blog/md/[slug]/route.ts`       |
| `/blog/og/<slug>`           | The social preview image, drawn from the title.                                                                                                  | `app/(marketing)/blog/og/[slug]/route.tsx`      |
| `/blog/feed.xml`            | Atom feed, advertised in the head of every blog page.                                                                                            | `app/(marketing)/blog/feed.xml/route.ts`        |
| `/blog/llms.txt`            | Every post grouped by category, linked to its Markdown copy.                                                                                     | `app/(marketing)/blog/llms.txt/route.ts`        |
| `/sitemap.xml`              | Site pages plus every blog page with last-modified dates.                                                                                        | `app/sitemap.ts`                                |
| `POST /api/blog/revalidate` | Expires the cached blog pages. Needs `Authorization: Bearer $CRON_SECRET`.                                                                       | `app/api/blog/revalidate/route.ts`              |
| `GET /api/blog/meta`        | Post count, latest date and category count, for dashboards.                                                                                      | `app/api/blog/meta/route.ts`                    |

The header nav (`NAV_LINKS` in `components/marketing/links.ts`) and the footer link to `/blog`.

## Where posts live, and why

Posts are rows in the `posts` table of the app's Neon Postgres database (`DATABASE_URL`; schema in `db/schema.ts`, migration `drizzle/0003_blog_posts.sql`, applied with `pnpm db:migrate`). The database is what the pages read.

Posts are authored as Markdown files with front matter in `content/blog/<slug>.md`, kept in git as the editable copy, and saved into the table by `pnpm blog:seed`. A re-seed leaves unchanged posts alone and skips a row whose body was edited in the database since its last seed (`md5(body)` vs `seeded_hash`) unless `--force`.

Without a database (a fresh clone, the CI build) every list is empty: the index says so, a post URL is a 404, and the build still succeeds.

## Caching

The blog pages are static with `revalidate = 3600`, so a seed shows up within the hour. `pnpm blog:seed` also POSTs to `BLOG_REVALIDATE_URL` with `CRON_SECRET` when both are set in `.env.local`, which expires the pages at once. This app does not use Cache Components, so the pages use ISR rather than `"use cache"`.

## The shapes

- **Post**: `lib/blog/schema.ts` (zod). Slug (from the file name), title, description, category, primaryKeyword, secondaryKeywords, length (`full` or `short`), tags (2 to 4), author, image, draft, publishedAt, updatedAt, body.
- **Categories, author, call to action, blog name**: `lib/blog/config.ts`. The index shows only categories that have a published post; it is meant to show all 12.
- **Colors**: the post body (`app/(marketing)/blog/blog.css`) uses the site tokens from `app/globals.css`, so it follows the light and dark themes.

## Read and write

- **One read path**: `lib/blog/loader.ts` (`listPublishedPosts`, `listPublishedPostsWithBody`, `getPublishedPost`). Returns nothing when `getDb()` is null.
- **One write path**: `savePost()` in `lib/blog/write.ts`. Validates the shape, runs the per-post content rules, upserts by slug. The slug is the primary key and the primary keyword is unique, so the database refuses duplicates whatever code calls it. The database handle is passed in, because `db/client.ts` is server-only and the scripts open their own connection.
- **Seed**: `pnpm blog:seed` (`--only a,b`, `--force`).

## The content check

`lib/blog/content.test.ts` runs every rule over the staged files as part of `pnpm test`, so the pre-push hook and CI are the gate. `pnpm check:content` runs the same rules over the database rows (or the files with `--files`; `--slug a,b` checks a subset with links resolved against `docs/blog-keywords.md`; `--report` prints words, opening length, overlap and inbound links per post). Rules are in `lib/blog/rules.ts`, each with a failing fixture in `lib/blog/rules.test.ts`: valid shape, unique and non-reserved slugs, one owner per keyword (and every mapped keyword has a post), keyword in title and slug and its words in the description and first paragraph, a 40 to 60 word opening and section openers under 60 words, at least 2 question headings, title up to 60 and description 120 to 160 characters, no top-level heading in the body, 1,500 prose words (800 for short), 4 to 8 second-level headings with distinct anchors, no heading shared between posts, at most 20% shared 5-word sequences between sections of different posts, known category and author, balanced categories (largest at most 2x the smallest, every category at least 2), internal links and anchors resolve, no orphans, https sources with descriptive link text, image alt text, honest dates.

## Adding a post or a category

Follow `.claude/skills/add-blog-post/SKILL.md`. A new category is an entry in `lib/blog/config.ts` plus a row in `docs/blog-plan/CATEGORIES.md`; it needs at least 2 posts and must keep the balance rule.

## Keeping posts fresh

A post is due a second look when a game change touches what it describes (the homepage, how-to-play page, FAQ, missions data and changelog are the sources of product facts), or a year after it was last checked. `updatedAt` moves only when the substance changes, because the recently updated list, the feed and the sitemap all show it.

## Planning files

`docs/blog-keywords.md` (the keyword map, its status column is the ledger, and the section plan), `docs/blog-plan/CATEGORIES.md` and `docs/blog-plan/WRITER-BRIEF.md`. The search-volume data behind the keyword choices stays in the private repository (`bomb-appetit-cloud/ai/seo/keywords/`), which also keeps a copy of the keyword table with volumes.
