---
title: "Games on GitHub: Reading the Bomb Appétit Repository"
description: "Games on GitHub can be read before they are played. A tour of the Bomb Appétit repository: the engine, the web app, frozen rules, tests and the private part."
category: open-source
primaryKeyword: "games on github"
secondaryKeywords: []
length: full
tags: ["github", "open source", "engine", "repository"]
author: bombappetit
draft: false
---

Games on GitHub let you read the rules before you play a single round. The Bomb Appétit repository holds a pure TypeScript engine with no clock or screen, a Next.js web app for the bomb and the manual, the standard rules frozen as JSON, a test suite with a seed sweep, and one private part.

## What games on GitHub let you read before you play

A game whose source sits on GitHub can be inspected as a set of decisions: how a bomb is generated, what counts as a mistake, how a score is judged. You do not have to trust a description of the rules. You can open the file that applies them, and you can see the tests that pin them down.

The public home of Bomb Appétit is the [Bomb Appétit repository on GitHub](https://github.com/masaok/bomb-appetit). It is a pnpm workspace with two halves: `packages/engine`, which is the game itself, and `apps/web`, which is everything a player touches in a browser. A third folder, `docs`, holds a single guide for people who want to add a puzzle. The site's [press page](/press) states the same licence position in one line: the code is MIT.

The table below is the map. It lists what sits at the top level of the repository, what each entry holds, and the file worth opening first if you only have ten minutes.

| Path                 | What it holds                                                            | Open first                    |
| -------------------- | ------------------------------------------------------------------------ | ----------------------------- |
| `README.md`          | How to run the game, how it is built, the private part, the licences     | the "How it is built" section |
| `CONTRIBUTING.md`    | Setup, the checks to run before a pull request, rules for code, sign-off | "Rules for code"              |
| `packages/engine`    | The game logic: bombs, modules, rules, replay. No dependencies           | `src/replay.ts`               |
| `apps/web`           | The Next.js app: bomb, manual, rooms, API, marketing site, blog          | `lib/server/runs.ts`          |
| `docs/modules.md`    | How to add a module, with Wires as the reference                         | the "Files" table             |
| `.github/workflows`  | The CI workflow that runs on every push and pull request                 | `ci.yml`                      |
| `.husky`             | The git hooks: format on commit, check and build on push                 | the pre-push hook             |
| `LICENSE`            | The MIT licence for the code                                             | the whole file, it is short   |
| `ARTWORK-LICENSE.md` | The CC BY-NC 4.0 terms for the mascot, logo and other art                | the whole file                |
| `TRADEMARK.md`       | Why the name and logo sit outside every licence                          | the whole file                |

A sensible reading order is the README, then `packages/engine/src/engine.ts`, then `replay.ts`, then the server code in `apps/web/lib/server`. By the end of that path you know how a bomb ticks, how a Defuser's input changes it, and how the server decides whether to believe a finished run. Everything else is presentation.

Reading code is a different activity from running it. If you would rather see the bomb on your own screen first, the guide on [running Bomb Appétit on your own machine](/blog/open-source-browser-games-run-locally) walks from a fresh clone to a working bomb in the browser. The short version of that guide lives in its section on [running the dev server for the first time](/blog/open-source-browser-games-run-locally#running-the-dev-server-for-the-first-time), which lists the two commands and what you should see.

## The engine package: the game without a clock or a screen

The engine package, `packages/engine`, is the whole game expressed as data and pure functions. It has no dependencies, never reads the system clock, never draws anything and imports nothing from React or Node. Time only moves when a caller passes it in, so the same inputs always produce the same bomb and the same outcome.

The README states the rule in two function names. Time enters the engine only through `advance(state, toMs)` and `act(state, action)`. The first moves the countdown forward to an elapsed time. The second applies one Defuser input, which the code calls a `LoggedAction`: a timestamp `t`, a module index `m` and an action `a`. A comment in `engine.ts` records one detail players feel without seeing: the countdown runs faster after a strike, at (4 + strikes) / 4 speed, so one strike means 1.25 times and two strikes mean 1.5 times.

The `src` folder is small enough to list:

- `bomb.ts` builds a bomb from its spec and seed.
- `engine.ts` holds `advance`, `act` and the hint lookup.
- `edgework.ts` covers the details printed on the case.
- `rng.ts` is the seeded random number generator every module draws from.
- `timer.ts` formats the clock.
- `replay.ts` rebuilds a run from a log and holds `ENGINE_VERSION`.
- `bot.ts` plays a bomb by following each module's hint, for tests.
- `modules/` has one folder per module, fourteen in all, plus `registry.ts`.
- `rules/` holds the rule book, the solvability check and the frozen standard manual.

Purity is not a convention that depends on reviewers noticing. ESLint rejects `Date.now()`, `Math.random()`, React imports and Node imports anywhere inside the package, and a test file named `purity-lint.test.ts` sits in the engine's test folder. A module that wants randomness takes it from the `Rng` it is handed. A module that wants the time reads it from the context the engine builds.

Each module is a state machine described by a `ModuleDef` in `types.ts`. The module guide in `docs/modules.md` spells out the contract. State is plain JSON and never mutated. `apply` is total, so any action that parses is safe in any state. `parseAction` treats a submitted log as untrusted and rebuilds each action from checked fields. A wrong action returns a strike. `hint` returns the one correct move right now, derived from the same rule lookup that judges the Defuser.

Because the engine knows nothing about screens, the web app can draw the same bomb as a flat 2D panel or a 3D case without the rules noticing. That separation is also what makes replay possible, which the post on [how the server replays a run to prove a defusal](/blog/open-source-games-how-a-replay-proves-a-defusal) covers in depth.

## The web app: bomb, manual, rooms and the marketing site

The web app in `apps/web` is a Next.js project that wraps the engine in everything a person needs: the bomb the Defuser touches, the manual the Experts read, online rooms, the API that accepts finished runs, the public pages and this blog. It imports the engine as `@bombappetit/engine` and adds no rules of its own.

The `app` folder follows the Next.js App Router. Route groups split the marketing pages from the rest of the site. One group, `(marketing)`, holds the home page, how to play, the FAQ, the press page, the changelog and the blog. Another, `(site)`, holds play, missions, the leaderboard, results and a dashboard. Beside them sit `bomb`, `manual/[ruleSeed]`, `api`, `admin`, and `r/[code]`, the short address a room code opens. The `components` folder mirrors that split, with `bomb` and `bomb3d` for the two views of the case, `manual` for the printed and on-screen manual, `room` for the lobby, and `modules` for each puzzle's two faces.

Every module appears twice in the web app. `Face.tsx` is the Defuser's view, drawn inside a fixed 300 by 300 pixel box. `Manual.tsx` is the Expert's page, a server component that renders from the rules alone and never sees a bomb. The module guide insists that a manual page reads correctly in black and white and names every colour in words, because people print it.

Server code lives in `lib/server`. The two files that explain the most are `runs.ts`, which accepts a finished run, and `leaderboard.ts`, which holds the only ranking query in the project. `tickets.ts` signs the record of which bomb the server handed out. Mission definitions live as JSON in `data/missions`, five per section across four sections, and `board-lock.json` records what each leaderboard was opened with.

Blog posts are Markdown files under `content/blog`. A content check in `scripts/check-content.ts` enforces the house rules before a post is saved, from title length to the links between posts.

## Where are the rules kept, and why are they frozen?

The rules are generated, not written by hand. Each module builds its manual rules from a rule seed, and the project accepts a generated rule set only after a solvability check plays 1,000 random bombs against it. Rule seed 1, the standard manual, is then saved as JSON so later code changes cannot move it.

The generators live with each module in `packages/engine/src/modules/<id>/index.ts`. The rule book that gathers them is `src/rules/book.ts`, and the acceptance test is `checkModuleSolvable` in `src/rules/solvable.ts`. The module guide states the requirement plainly: for every bomb, the rules must resolve to exactly one correct action at each step. A manual page renders from that rule data and nothing else, so the page and the judge cannot drift apart.

The frozen copy sits in `packages/engine/src/rules/seed-1/`, one JSON file per module, from `big-button.json` to `word-grid.json`. An `index.ts` beside them is written by a script and carries a warning not to edit it by hand. If you want to see what the standard manual says about a module without running anything, those JSON files are the answer. The live version of the same content is the [standard manual for rule seed 1](/manual/1) on the site.

Why freeze it? A generator is code, and code changes. If someone improves a word list or reorders a shuffle, every seed's manual shifts with it. For most seeds that is acceptable. For seed 1 it is not: printed manuals, practised teams and leaderboard runs all depend on it. A test in `test/rules.test.ts` compares each frozen file with what its generator produces for seed 1. If they differ, the test fails with a note telling the author to run `pnpm rules:freeze` and bump `ENGINE_VERSION`.

The version bump matters because stored runs are replayed under the engine version that produced them. Players who want to understand what changes from one seed to another, and why a new seed makes a memorised manual wrong, can read the post on [how a rule seed rewrites the manual](/blog/games-with-random-rules-rule-seed-manual).

## Tests, the rule-seed sweep and what CI runs

The repository is checked three times: by a hook on your machine, by CI on every push and pull request, and by a nightly browser suite. CI runs formatting, lint, typecheck, unit tests, a sweep of rule seeds 2 to 500 and a production build that uses no secrets.

The workflow file is `.github/workflows/ci.yml`. It defines six jobs, each on a fresh runner:

1. `format` runs `pnpm format:check`.
2. `lint` runs `pnpm lint` across every package.
3. `typecheck` runs `pnpm typecheck`.
4. `test` runs `pnpm test`.
5. `rule seeds 2 to 500` runs `pnpm --filter @bombappetit/engine test:rules`.
6. `build (no secrets, cloud stub)` runs `pnpm build`.

The seed sweep earns its own job because it is slow. A comment in the test file puts the full run of seeds 2 to 500 at about two minutes, so the everyday test run covers seeds up to 40 and the separate job does the rest. Each seed must produce rules that the solvability check accepts, for every module. As an example, a generator change that made seed 317 unsolvable would fail here, long before a player met it.

Engine tests live in `packages/engine/test`, with one file per module under `test/modules` and wider files such as `full-bomb.test.ts` and `core.test.ts`. The module guide asks for table tests with literal expected values, tests for the correct, wrong and ignored action, and a check that rule generation is deterministic per seed. It also bans a test that would still pass if the code under test returned `undefined`.

On the web side, the leaderboard tests run the real ranking SQL against an in-process Postgres built from the migration files. Another test fails when a mission's time limit, strike limit, module pool or seeds change without a new board epoch. The Playwright suite runs nightly rather than per push, because it needs a live database.

Locally, `CONTRIBUTING.md` describes the hooks. A pre-commit hook only formats the staged files. A pre-push hook runs `pnpm check` and then a build, so a change that fails either never leaves your machine.

## What lives in the private repository, and why?

Three things are kept out of the public repository: the anti-cheat plausibility checks, licensed assets and the admin pages. The README gives the reason in one line of logic: the engine is public, so anyone could write a bot that submits a valid log, and checks that tell a bot from a person only work while they stay unpublished.

The private code arrives at build time as a package named `@bombappetit/cloud`. The public repository declares the whole interface in a single file, `apps/web/lib/cloud-contract.ts`. Its opening comment calls it the seam between the public and private code. Reading it tells you the shape of what crosses that seam, not the thresholds on the far side.

If you clone the repository without access to the private package, `apps/web/lib/cloud-stub.tsx` implements that same contract. With the stub, every valid replay is accepted and the CC0 sound effects play. `scripts/sync-cloud.mjs` decides between the stub and the real package before each dev and build run. The live site's production deploy refuses to start on the stub, while CI builds against it on purpose, which is why that job's name says so.

None of this hides how a run is judged in the first place. The replay that rebuilds a bomb from its log is public, and it is the step that decides whether a defusal happened at all. The post on the replay design explains [what the server replays and what it stores](/blog/open-source-games-how-a-replay-proves-a-defusal#what-the-server-replays-and-what-it-stores), including the fields saved with each run.

The licences split along the same lines as the folders. Code is MIT. The sound effects in `apps/web/public/audio` are CC0 and generated by a script in the repository. The mascot, logo and other artwork are CC BY-NC 4.0. The name Bomb Appétit and its logo are covered by none of these, which `TRADEMARK.md` explains. If you fork the project, you can reuse the engine freely, but you need your own name.
