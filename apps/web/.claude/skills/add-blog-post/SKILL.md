---
name: add-blog-post
description: Add one post to the Bomb Appétit blog, or improve an existing one. Use when asked to write, add or publish a blog post, or to target a new keyword.
---

# Add a blog post

1. Read `docs/blog.md`, the keyword map and section plan in `docs/blog-keywords.md`, and the keyword data in the private repository (`bomb-appetit-cloud/ai/seo/keywords/keywords.md`). If the keyword already has a post, improve that post instead of writing a second one.
2. Pick the category from `lib/blog/config.ts`. Count published posts per category first (`pnpm check:content --files --report`). Where the topic fits more than one, choose the one with fewer posts, and keep the largest category at most twice the smallest.
3. Add the keyword-map row first: keyword, intent, length, category, title (at most 60 characters, contains the keyword), slug (contains the keyword hyphenated; never `recent`, `category`, `feed.xml`, `llms.txt`, `md`, `og`), description (120 to 160 characters), secondary keywords, status `planned`.
4. Add the post's block to the section plan: the question it answers, 4 to 8 headings (at least 2 questions, one about a mistake or edge case, none shared with any other post), the concrete element, and the posts it links to. A subtopic another post owns gets a sentence and a link, not a section.
5. Write `content/blog/<slug>.md` to `docs/blog-plan/WRITER-BRIEF.md`: front matter as in any existing post, a 40 to 60 word opening that answers the question, at least 1,500 prose words (800 if short), every claim about the game from the repository, every outside claim linked to an https primary source you read.
6. Link to two other posts, one in the same category, and to a site page. Add a link to the new post from an existing post on the same subject so it is not an orphan; if that post's substance changed, set its `updatedAt`.
7. `pnpm check:content --files --slug <new>,<linked-from>` must pass, then `pnpm test`. Then `pnpm blog:seed --only <new>,<linked-from>` and `pnpm check:content` (database, full rules) must pass.
8. Open `/blog/<slug>` in the running app: click a table-of-contents entry, confirm the call to action shows under the table of contents and at the end, and that the post is on its category page and at the top of `/blog/recent`.
9. Set the row's status to `published`, commit, and push.

To improve an existing post: edit its file, set `updatedAt` only if the substance changed, run steps 7 and 8, and confirm it leads `/blog/recent/updated`.
