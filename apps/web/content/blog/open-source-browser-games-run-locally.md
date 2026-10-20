---
title: "Open Source Browser Games: Run Bomb Appétit Locally"
description: "Open source browser games can run on your own machine. How to clone Bomb Appétit, install with pnpm, start the dev server, and what a database adds."
category: open-source
primaryKeyword: "open source browser games"
secondaryKeywords: ["open source web games", "free open source multiplayer games"]
length: full
tags: ["open source", "local setup", "pnpm", "postgres"]
author: bombappetit
draft: false
---

Open source browser games can run on your own computer with a few commands. For Bomb Appétit you need Node 22 and pnpm: clone the repository, run `pnpm install`, then `pnpm dev`, and open localhost:3000. That gives you the full single-device game. A Postgres database adds online rooms, saved runs and leaderboards.

## Why open source browser games are easy to run yourself

A browser game already ships as a web server plus pages, so running it locally means starting that server on your laptop instead of someone else's. There is no installer to build and no store to go through. When the source is public, the only prerequisites are the runtime and the package manager the project names.

Bomb Appétit is a co-op bomb defusal party game: one player, the Defuser, sees a ticking bomb, and the Experts hold the manual. Its code lives in the [public Bomb Appétit repository on GitHub](https://github.com/masaok/bomb-appetit) under the MIT licence. The project is a pnpm workspace, which means one install at the root fetches what both the engine package and the web app need.

The README asks for two tools. Node 22 runs the server and the scripts. pnpm is the only supported package manager; `CONTRIBUTING.md` repeats "Use pnpm" as its first rule for code. The root `package.json` names the exact pnpm version in its `packageManager` field, and its `engines` field asks for Node 22 or newer.

The other reason this game is easy to run is that the project was set up for strangers to clone it. `CONTRIBUTING.md` says it directly: a fresh clone needs no secrets. You do not need a cloud account, a token or an invitation to see a working bomb, and the features that do need a service are listed in one example file.

If you would like to know what you are about to run before you run it, the tour of [the engine package, the game without a clock or a screen](/blog/games-on-github-bomb-appetit-repository#the-engine-package-the-game-without-a-clock-or-a-screen) explains the folder that holds every rule. It is a short read and makes the rest of the code easier to follow.

## Running the dev server for the first time

Running the dev server takes two commands from the repository root: `pnpm install`, then `pnpm dev`. Before Next.js starts, a small script prepares the private package slot and, on a fresh clone, reports that it is using the public stub. Then the server prints its local address and the game loads at `http://localhost:3000`.

Here is the whole path from nothing to a playable bomb. The commands are copied from the README. The printed lines in quotes are taken from the scripts that run; anything else on your screen comes from pnpm or Next.js and varies by version.

1. Clone the repository from GitHub and change into its folder.
2. Check your Node version with `node --version`. The README asks for Node 22.
3. Run the install:

   ```sh
   pnpm install
   ```

   pnpm resolves the workspace and installs both packages. A `prepare` script also sets up the git hooks.

4. Start the dev server:

   ```sh
   pnpm dev
   ```

   The root script hands off to the web app. Its first step, `scripts/sync-cloud.mjs`, prints `cloud: no private package configured, using the public stub` when no private package is set. Next.js then starts and prints the local address.

5. Open `http://localhost:3000` in a browser. The home page loads, and Play takes you to a mission or a freeplay bomb.
6. Open the manual on a second device or a second browser window at `/manual/1`, the standard manual, and start talking.

The stub message in step 4 is not an error. Bomb Appétit keeps a few things in a private package, and the public repository includes a stand-in that implements the same interface. With the stub, every valid replay is accepted and the CC0 sound effects play. Nothing about solo or same-room play depends on the private code.

If the install fails, check the two prerequisites first: a Node older than 22, or an install run with a package manager other than pnpm. Fix the tool, then run `pnpm install` again from the root.

## What works with no configuration at all?

With no configuration file at all, the local server gives you the whole game on one machine: solo and same-room play, all 14 modules, every mission, the manual for any rule seed, and both the 2D and 3D bomb. You can print the manual too. Only features that need shared storage between players are missing.

Same-room play is the way most groups start anyway. Put the bomb on a laptop, open the [standard manual for rule seed 1](/manual/1) on a phone or tablet, and the Experts read while the Defuser describes. Change the number in that address to load the manual for another seed, and set the same seed on the bomb.

The 14 modules are the same ones the public site runs, because the modules come from the same engine package. The missions come from the JSON files in `apps/web/data/missions`, twenty in all. Freeplay lets you choose the module pool, how many regular and needy modules to fit, the time limit, the strike limit and the rule seed. The server adds the bomb seed.

Finished runs still pass through the server even without a database. The server replays the log on its engine and returns a summary, but with nowhere to save it, the run gets no id and no standing. That is the code path in `lib/server/runs.ts` that returns early when there is no database. You see the result screen; nothing is kept.

Printing works exactly as it does on the live site, because the manual is a page like any other. Use the browser's print command on the manual page. The FAQ notes that it is laid out to print cleanly in black and white, and that the seed on the paper has to match the bomb.

## What does a database add, and how do you set one up?

A Postgres database adds the features that need memory between requests or between players: online rooms that connect browsers far apart, saved runs, mission progress and the leaderboards. Setting one up means copying an example environment file, adding one connection string, and running two scripts that create the tables and load the missions.

The README gives the steps. Copy `apps/web/.env.example` to `apps/web/.env.local`, set `DATABASE_URL` to your Postgres connection string, then run these from the root:

```sh
pnpm db:migrate
pnpm db:seed
```

The first command applies the SQL migration files in `apps/web/drizzle` in order. It holds a Postgres advisory lock while it works, so two runners never migrate the same database at once. When it finishes it prints `Migrations are up to date.` If you forgot the connection string, it stops and prints `DATABASE_URL is not set. Put it in apps/web/.env.local (see .env.example).`

The second command copies the mission definitions from the JSON files into the database. It prints `Seeded 20 missions.` on a fresh setup, because there are twenty. It is safe to run again: existing missions are updated in place, and any mission removed from the JSON is removed from the table so the two stay in step.

The example file is worth reading in full. The README says `.env.example` lists every variable and what turns on when you set it. Leaderboard entries carry a name, which comes from signing in with GitHub, so a fully featured local copy also needs sign-in credentials. Guests can still play everything.

One more variable deserves a warning. Adding `DEV_ADMIN_BYPASS=1` to `.env.local` opens `/admin` without signing in, but only under `pnpm dev`. A production build and anything on Vercel ignore it. The README is blunt that the bypass acts on whatever database `DATABASE_URL` points at, so its buttons change real rows. Point it at a scratch database.

## The local setup mistake: expecting rooms without a database

The most common surprise is trying to create an online room on a copy with no database. Rooms are stored server-side so that a Defuser and Experts in different places can find the same game by code, and without Postgres there is nowhere to store them. Same-room play works; remote rooms do not.

The README lists online rooms first among the features that need Postgres. A room has a code, a list of players with roles, a status and the round in progress, and all of that lives in tables. A local server with no database has no table to write the room into and no way for a second browser to look it up.

This is easy to miss because the rest of the game feels complete. Missions load, the bomb ticks, the manual renders, the result screen appears. It is only when you reach for the multiplayer part of these free open source multiplayer games that the gap shows.

There are two fixes. If everyone is in one room, skip online rooms entirely: put the bomb on one screen and the manual on the others. If you want to test rooms, add a database as described above and restart `pnpm dev` so the server picks up the new environment.

How a room actually connects two browsers that are miles apart, from the host's side and the player's side, is covered in the guide to [how a room code connects browsers far apart](/blog/multiplayer-browser-games-to-play-with-friends#how-a-room-code-connects-browsers-far-apart). It is written for players, so it is also a good test script for your local rooms. For more on online play as a group, see the broader post on [multiplayer browser games to play with friends](/blog/multiplayer-browser-games-to-play-with-friends).

A related surprise: a run you finish locally with a database but without signing in will not appear on a local leaderboard. Boards list signed-in players only, by their best verified defusal. That is by design, not a broken setup.

## Local run checklist

A local run is ready when five things are true: Node 22 and pnpm are installed, the install finished, the dev server is up on port 3000, the bomb and the manual use the same rule seed, and you know whether you have a database. Use the list below before a session or before filing an issue.

- [ ] `node --version` reports 22 or newer.
- [ ] `pnpm install` finished at the repository root without errors.
- [ ] `pnpm dev` printed the stub line, or a line saying the private package was synced, and then the local address.
- [ ] `http://localhost:3000` shows the home page.
- [ ] The manual is open at `/manual/1`, or at the seed you set on the bomb.
- [ ] For online rooms, saved runs or leaderboards: `.env.local` has `DATABASE_URL`, and `pnpm db:migrate` and `pnpm db:seed` both printed their success lines.
- [ ] If you set `DEV_ADMIN_BYPASS=1`, `DATABASE_URL` points at a database you can afford to change.
- [ ] Before sending a change, `pnpm check` and `pnpm build` both pass.

The last item is from `CONTRIBUTING.md`. `pnpm check` runs lint, typecheck and the unit tests. The repository's pre-push hook runs the same check and then a build, so a change that fails either one stays on your machine. CI repeats the checks on every push and pull request, and it treats a failure as a stop.

Your local copy uses the stub for the anti-cheat step, so it accepts any run that replays. That is fine for playing and for development. The live site works differently, and the explanation of [how a replay proves a defusal](/blog/open-source-games-how-a-replay-proves-a-defusal) covers what the server checks before a run counts on a public board. If you want to know where each piece of the code lives before you change it, the [tour of the Bomb Appétit repository](/blog/games-on-github-bomb-appetit-repository) maps the folders.
