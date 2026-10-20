---
title: "Games With Leaderboards: How a Defusal Gets Ranked"
description: "How games with leaderboards pick who is on top, and how Bomb Appétit does it: one board per mission, time left then strikes, verified runs only, percentiles."
category: missions-and-leaderboards
primaryKeyword: "games with leaderboards"
secondaryKeywords: ["leaderboard gaming", "browser games with leaderboards"]
length: full
tags: ["leaderboards", "missions", "verified runs"]
author: bombappetit
draft: false
---

Games with leaderboards rank players by a number everyone can compare, earned under identical rules. Bomb Appétit keeps a separate board for each mission and orders defusals by time left on the clock, then fewest strikes, then whichever run came first. Only verified runs by signed-in players are listed, and each player sees a percentile.

## What games with leaderboards need to be fair

A fair leaderboard needs three things. Every entry must be played under the same conditions, the order must follow one clear rule, and the board must have some way to tell a real result from a made-up one. Drop any of the three and the people at the top stop meaning anything.

Same conditions is the part players notice first. In leaderboard gaming, a time only means something next to times set on the same course. A Bomb Appétit mission pins down everything that shapes a run: the time limit, the strike limit, the pool of modules the bomb draws from, how many needy modules it carries, the case size and the rule seed that writes the manual. Two of the missions, First bite and Button up, go further and hand every player the identical bomb. The rest deal a fresh bomb from the mission's pool each time, so the module mix varies while the rules around it stay fixed.

One clear rule is the part players argue about. If the board sorts by time on one page and by date on another, two people can both claim to be ahead. Bomb Appétit writes its ordering in a single query, and the public board, the percentile a player sees and the admin view all read from it. A rank has one definition.

Real results are the hardest part for browser games with leaderboards. The game runs in the player's browser, which means the player controls the code that reports the score. A server that believes whatever the browser sends will soon list impossible times. Bomb Appétit's server trusts nothing the client says about the outcome and checks every run itself before listing it, which a later section covers.

There is a fourth condition that is easy to forget: the board must be optional. Bomb Appétit is free, needs no account and lets guests play every mission. Signing in with GitHub only adds two things, a place on the leaderboards and saved progress. Nobody has to compete to play.

## One board per mission: why there is no overall ranking

Bomb Appétit ranks each mission on its own because a time from one mission says nothing about another. First bite gives five minutes for one module. Double shift gives fifteen minutes for fourteen modules and three needy ones. Adding those times up would reward whoever played the most missions, not whoever defused best.

The game has 20 missions in four sections, so it has 20 current boards. On the [leaderboard](/leaderboard) page you pick a mission from a list labelled by section and order, such as "1.5 Quick snack", and the board for that mission appears. For a walk through what each of the 20 missions adds, from one wire module up to the bigger case, see [the mission ladder from First bite up](/blog/competitive-co-op-games-missions-first-bite-up).

A board is tied to one version of a mission, which the code calls a board epoch. If a mission's time limit, strike limit, module pool or seeds ever change, its epoch goes up and a new, empty board opens. The old board is not deleted. It stays as an archive, and the leaderboard page links to "the board before the change" so earlier times are still visible but never mixed with times set under different rules. A test in the project fails if someone edits a mission without opening a new board.

Each board also has a team filter with three settings: Everyone, Solo and With Experts. A solo run is one where the Defuser played without any Experts. Runs with Experts show their names beside the Defuser's, so a team can find its own row. The filter changes which runs are compared, not how they are ordered.

## How is a defusal ranked: time left, strikes, then date?

A defusal is ranked by the time still on the clock when the last module is solved, most time first. Two runs with the same time left are split by strikes, fewest first. If time and strikes both match, the run saved earlier wins. A bomb that exploded is never ranked, however close it came.

Time left comes first because it is the measure of the whole run. Strikes still matter more than their place in the order suggests, because each one speeds the clock up for the rest of the bomb. A team that picks up two strikes usually pays for them in seconds long before a tie-break is needed. For where those seconds go and how a team gets them back, read [where a defusal loses its seconds](/blog/time-attack-games-faster-without-strikes#where-a-defusal-loses-its-seconds). Our guide to [getting faster without more strikes](/blog/time-attack-games-faster-without-strikes) covers the habits behind a quicker run.

Each player appears once per board, by their best verified defusal. Playing a mission twenty times does not give you twenty rows. It gives you one row that moves up when you beat your own best. The board lists the Defuser, since the Defuser's browser is the one that runs the bomb, and names the Experts beside them.

### A worked example: three runs on Quick snack

The runs below are an invented example, not real board entries. Quick snack gives four minutes for four modules, so every time left is out of 4:00. Imagine these are the only three players on the board.

| Player (example) | Time left | Strikes | Board rank | Percentile shown |
| ---------------- | --------- | ------- | ---------- | ---------------- |
| Player C         | 2:05      | 2       | 1          | Top 34%          |
| Player B         | 1:42      | 0       | 2          | Top 67%          |
| Player A         | 1:42      | 1       | 3          | Top 100%         |

Player C ranks first despite two strikes, because 2:05 left beats 1:42 left and time is checked before strikes. Players A and B tie on time, so strikes decide: B had none, A had one, and B goes above A. If B and A had also tied on strikes, the run saved earlier would take second place. The percentiles look harsh on a board this small, and the percentile section below explains why.

## Verified runs only: what the server checks before listing

A run is listed only after the server has replayed it. The Defuser's browser records every action with a timestamp and sends the log when the bomb ends. The server plays that log through the same engine on the bomb it issued and keeps its own result. If the replay ends differently, the run is not listed.

This works because the engine is deterministic. A bomb is a function of its bomb seed, and a manual is a function of its rule seed. Time only enters through the recorded actions and their timestamps. Given the same seed and the same log, the engine reaches the same result every time, on any machine. A browser that claims a defusal its log does not produce gets caught at the replay. The full design, including what the server keeps, is in [what the server replays and what it stores](/blog/open-source-games-how-a-replay-proves-a-defusal#what-the-server-replays-and-what-it-stores), part of our post on [how a replay proves a defusal in an open source game](/blog/open-source-games-how-a-replay-proves-a-defusal).

A matching replay is not quite enough. Because the engine is public, anyone could write a program that plays a bomb perfectly and submits a valid log. So a run is marked verified only when the replay matches and a set of plausibility checks also pass. Those checks live in a private part of the project, because a check that tells a program from a person only works while its details are unpublished.

Two more filters sit in the same query. The player must be signed in, since guests are never ranked. And the player must not have been taken off the boards. A run that fails either test can still be a great evening. It just does not appear in the ranking.

## What does a percentile rank mean on your dashboard?

A percentile rank is your place on a board written as a share of everyone on it. "Top 12%" means 12% of ranked players on that mission did as well as you or better. Bomb Appétit shows it on the missions page, the results page and your dashboard, for each mission where you are ranked.

The arithmetic is short. Take your rank, divide by the number of players on the board, multiply by 100 and round up. The result is never shown below 1% or above 100%. Rank 24 on a board of 200 players gives 24 divided by 200, which is 12%, so the label reads Top 12%. Rank 1 on that same board gives 0.5%, which is shown as Top 1%.

Small boards make percentiles jumpy. On a board of three, first place is Top 34%, because one player out of three is a third of the board and the figure rounds up. That is why the worked example above shows numbers that look unkind. As more players defuse a mission, each place moves the percentile by less, and the number settles.

The leaderboard page adds a plain line for signed-in players: your rank, the size of the board and your percentile, such as "You are #24 of 200, in the top 12%". When your row is further down than the page you are viewing, it is pinned under the table so you do not have to page through to find yourself. On the leaderboard page the line follows the team filter, so switching to Solo compares you only with solo runs. The missions page and the dashboard always use the whole board.

## Why did my run not appear on the leaderboard?

A run stays off the board for one of a handful of reasons: you played as a guest, the bomb went off, the replay or the checks rejected it, it was not your best time on that mission, or you are looking at a different filter or an older board. Check them in that order.

1. **You were not signed in.** Guests can play everything, but only signed-in players are ranked.
2. **The bomb did not end in a defusal.** Timeouts and explosions are never ranked, even with one module left.
3. **The run was not verified.** If the server's replay disagreed with the browser, or a plausibility check failed, the run is stored but not listed.
4. **It was not your best.** The board shows one row per player per mission. A slower defusal leaves your earlier, faster row in place.
5. **You were an Expert.** Rows belong to the Defuser. An Expert's name appears beside the Defuser's on that row, not as a row of its own.
6. **The filter hides it.** A solo run does not appear under With Experts, and a team run does not appear under Solo. Set the filter to Everyone.
7. **The mission changed.** If the mission's board epoch went up, runs set before the change live on the archived board, which the leaderboard page links to.
8. **The server has no database.** A copy of the game running locally without Postgres has no leaderboards at all, and says so.

If none of these apply, pick the mission on the [missions page](/missions) and check the Defused badge on its card. It shows your best time left and, once you are ranked, your percentile.
