---
title: "Open Source Games: How a Replay Proves a Defusal"
description: "Open source games cannot hide their rules, so Bomb Appétit proves each run: the engine is deterministic and the server replays every log before it counts."
category: open-source
primaryKeyword: "open source games"
secondaryKeywords: ["open source game engines"]
length: full
tags: ["open source", "replay", "leaderboards", "anti-cheat"]
author: bombappetit
draft: false
---

Open source games can still trust a leaderboard run, because the score does not come from the player's claim. In Bomb Appétit the browser records every action with a timestamp, and the server replays that log with the same deterministic engine on the bomb it issued. A run counts only if the replay defuses it and further checks pass.

## Why can't open source games hide their rules?

Open source games publish the code that applies their rules, so anything the client knows, a reader can know too. A cheater can read how scoring works, change the client, and send whatever they like. The only defence that survives publication is a server that refuses to take the client's word for anything.

A scoring scheme that accepts the final number a client sends depends on nobody knowing how to forge that number. That scheme breaks when the client's source is public. Anyone who forks the [Bomb Appétit code on GitHub](https://github.com/masaok/bomb-appetit) can build a version that reports a perfect run.

Bomb Appétit's answer is written into its README as a principle: the server trusts nothing from the client. It never reads the outcome the browser reports. It reads only the list of inputs, and it works out the outcome itself. If the inputs do not produce a defusal on the server's own copy of the engine, there is no defusal.

That approach turns publication from a weakness into a strength. Because the engine is open, anyone can check that the server's judge and the player's bomb run the same code. There is no hidden rule that marks some runs down. The FAQ entry on [whether leaderboard runs are verified](/faq) gives the short version for players.

## A bomb is a function of its seed: the deterministic engine

The engine is deterministic: given the same bomb seed, rule seed and list of timed inputs, it always produces the same bomb, the same strikes and the same ending. Nothing inside it reads the system clock or draws a random number of its own. That property is what lets a server repeat a run exactly.

The README puts it in two sentences. A bomb is a function of its bomb seed. A manual is a function of its rule seed. Every random choice, from which wires appear to which needy module wakes next, comes from a seeded generator built from those numbers, so two computers with the same seeds build identical bombs.

Time is treated the same way. The engine has exactly two doors for it: `advance(state, toMs)`, which moves the clock to a given elapsed time, and `act(state, action)`, which applies one input at its timestamp. Between those calls the bomb does not change. A strike speeds the countdown, and needy modules wake on their own schedule, but both follow from the elapsed time the caller passes in.

The project enforces this mechanically. ESLint rejects `Date.now()`, `Math.random()`, React imports and Node imports anywhere in `packages/engine`. A module that needs randomness after its bomb is built stores a key and a counter in its state and draws from a generator forked from them, so even later randomness replays identically.

Developers comparing open source game engines will recognise the pattern: a simulation that only moves when fed inputs. Here it is small. Readers who want to see it in code can follow the tour of [the engine package, the game without a clock or a screen](/blog/games-on-github-bomb-appetit-repository#the-engine-package-the-game-without-a-clock-or-a-screen), which lists each file and where to start.

## What the server replays and what it stores

The server replays the Defuser's action log against the bomb named on its own signed ticket, then saves the outcome the replay reaches, not the outcome the browser displayed. The stored row keeps the seeds, the engine version, the result, the time left, the strikes and the full action log, so the run can be replayed again later.

### The ticket

Before a run starts, the server issues a run ticket. The code in `lib/server/tickets.ts` calls it the server's signed record of what it handed out: the bomb spec, the mission or room, whether the server picked the bomb seed, and when it was issued. Each ticket has an id that can be redeemed once. The browser cannot alter it without breaking the signature.

### The log

The Defuser's browser runs the engine locally, so the bomb responds instantly. Each input is recorded as a `LoggedAction` with three fields: `t`, the elapsed milliseconds; `m`, the module's position on the bomb; and `a`, the action itself. When the bomb ends, the browser posts the ticket and a log holding the actions and `endMs`, the moment its clock stopped.

### The replay

The `replay` function in `packages/engine/src/replay.ts` treats the log as untrusted input. It rejects a log with more than 20,000 actions, an `endMs` more than a minute past the time limit, or any action that is out of time order or aimed at a module that does not exist. Each action must also pass its own module's `parseAction`, which rebuilds it from checked fields. Then the engine applies the actions one by one and advances the clock to `endMs`.

### The summary and the row

A helper named `summarize` reads the final state and returns one of three results: defused, exploded or abandoned, with a reason such as "Time ran out" or "Strike 3 on Wires". The server saves that summary with the bomb seed, rule seed, `ENGINE_VERSION`, spec, strikes, time remaining and the log. If the same ticket arrives twice, the server reports the run it already stored instead of saving a second one.

The step list below follows one run from the first action to the board. The values in it are an example, not a real run.

1. Example: the server issues a ticket for a mission, with bomb seed 4821 and rule seed 1, and the browser builds that bomb.
2. The Defuser cuts a wire at 3,200 ms. The browser applies it locally and records `{ t: 3200, m: 0, a: … }`.
3. Forty more inputs follow over three minutes. Each is applied in the browser and appended to the log.
4. The last module solves. The browser posts the ticket with `{ actions, endMs }`.
5. The server checks the ticket's signature and reads the bomb spec from it, ignoring anything else the browser says.
6. The server replays the log. If any action is malformed or out of order, the submission is rejected with the reason.
7. The replay ends defused, with, say, 1 minute 40 seconds left and one strike. That is what gets stored.
8. The private plausibility checks look at the run. A run is marked verified only if they pass and the result is not abandoned.
9. If the player is signed in and the run is a verified defusal on a mission, the board for that mission updates and the player sees their rank.

## Why the standard rules are frozen as data

The standard manual, rule seed 1, is stored as JSON files in the engine so that a later change to a rule generator cannot quietly change it. Frozen rules keep old runs replayable and printed manuals correct, and a test fails if the generator and the frozen copy ever disagree.

Rules in Bomb Appétit are generated from the rule seed by each module's own generator, and a rule set is accepted only after `checkModuleSolvable` plays 1,000 random bombs against it. Generators are code, though, and code gets edited. A tidier shuffle or a new word list would shift every seed's manual, seed 1 included.

Seed 1 is the one that matters most for verification. Nineteen of the twenty missions use it, teams practise with it, and people print it. So its output is saved in `packages/engine/src/rules/seed-1/`, one JSON file per module. A test compares each file with what the generator now produces and, on a mismatch, tells the author to run `pnpm rules:freeze` and bump `ENGINE_VERSION`.

The version number is the second half of the guarantee. `ENGINE_VERSION` lives in `replay.ts`, and its comment says to bump it whenever any module's logic or generation changes, so stored runs replay under the version that produced them. Every saved run carries the version it was played on. A replay that ran under different rules would not be a replay at all.

Boards add one more lock. Each mission has a board epoch, and a change to its time limit, strike limit, module pool or seeds must raise that epoch, which opens a new board and archives the old one. Times on one board were all set under the same conditions.

## Can a bot submit a valid run?

Yes, a bot can produce a log that replays to a clean defusal, and the README says so openly. The engine is public, and a program can play it perfectly. Replay proves that the inputs defuse the bomb; it cannot prove a person made them. That gap is what the private plausibility checks are for.

The repository even contains a bot. `packages/engine/src/bot.ts` plays a bomb to the end by following each module's hint. Its comment says it exists to prove bombs are completable and to produce logs for replay tests, and that it is not shipped to players. Any developer could write something similar in an afternoon.

So the project keeps one piece out of public view. The plausibility checks that tell a bot from a person live in a private package and are pulled in at build time. The README gives the reason: those checks only work while they are unpublished. Everything else, from the replay to the ranking query, is public.

A clone of the public repository uses a stub in place of that package. With the stub, every valid replay is accepted, which is fine for playing at home. If you run the game on your own machine following the guide to [running Bomb Appétit locally](/blog/open-source-browser-games-run-locally), your local runs will all count as verified for exactly that reason.

A run that replays correctly but fails the private checks is saved with its reasons and kept off the leaderboards. It is not deleted, and nothing about it changes the replay result itself.

## The open source mistake: assuming public code means unverifiable scores

A common assumption is that a game with public code cannot have honest scores, because anyone can change the client. The assumption confuses where a score is computed. When the server computes it from inputs on its own copy of the engine, changing the client changes nothing that is counted.

Consider what a modified client could try. It could claim a faster time, but the server never reads a claimed time. It could send a log of perfect moves, but the moves still have to defuse the specific bomb on the ticket, and the ticket is signed. It could reuse an old ticket, but a ticket can be redeemed once. It could send a log by a bot, which is the case left to the private checks.

The opposite mistake also happens: believing that because the replay is public, the leaderboard is fully public too. It is not. Only signed-in players appear, each listed once by their best verified defusal, and an admin can take a player off the boards. How the board orders the runs that pass is covered in the post on [verified runs only and what the server checks before listing](/blog/games-with-leaderboards-how-a-defusal-gets-ranked#verified-runs-only-what-the-server-checks-before-listing).

The README sums up the ranking in one place. `apps/web/lib/server/leaderboard.ts` holds the only ranking query: most time left, then fewest strikes, then the earlier run. The public [leaderboard](/leaderboard), the percentile a player sees and the admin view all read from it. For a fuller account of ranking, see the guide to [how a defusal gets ranked on the leaderboards](/blog/games-with-leaderboards-how-a-defusal-gets-ranked).

If you want to see each piece in code before trusting any of this, the [tour of the Bomb Appétit repository](/blog/games-on-github-bomb-appetit-repository) points to the files, from `replay.ts` to the CI job that sweeps rule seeds.
