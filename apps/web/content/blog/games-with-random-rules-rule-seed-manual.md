---
title: "Games With Random Rules: How a Rule Seed Rewrites the Manual"
description: "Games with random rules stay fair when the rules are fixed before play. How a rule seed builds every manual page, why seed 1 is standard and what changes."
category: rule-seeds
primaryKeyword: "games with random rules"
secondaryKeywords: []
length: full
tags: ["rule seeds", "manual", "fairness"]
author: bombappetit
draft: false
---

Games with random rules are fair when the randomness happens before anyone plays and every player reads the same result. In Bomb Appétit, a number called the rule seed produces the whole manual in advance. The Defuser and the Experts agree on that number, the rules stay fixed for the round, and nothing shifts mid-game.

## Why games with random rules must fix the rules before play

Random rules are only fair if they are settled before the first move and shared by everyone. If a rule could change while a team plays, a correct answer could turn wrong between asking and acting. Fixing the rules up front turns randomness into variety rather than luck, and every player can check what they got.

Think about what a rule does in a cooperative puzzle game. An Expert reads it, a Defuser acts on it, and the bomb judges the action. All three need to agree on the rule at that moment. If the rule were rolled fresh when the Defuser cut a wire, the Expert's reading would be a guess.

There is a second fairness question: was the random rule even solvable? A generator can produce nonsense, such as a rule that never applies, or a set of rules that leaves some bombs with no correct move. A game that prints those would be unfair in a way no amount of skill could fix.

Bomb Appétit answers both questions in the same way. The rules come from a seed, which is a fixed number, so the same number always gives the same manual. And each module's rules are tested before they are accepted, so a generated manual cannot ask the impossible. The randomness lives entirely in the step of choosing a seed. After that, the round is as fixed as a printed rulebook.

Fixed rules also make variety useful. Because a seed always gives the same manual, a group can name a seed, play it, talk about it, and come back to it. Once a group knows a manual too well, the guide on [why a new seed beats memory in replayable party games](/blog/replayable-party-games-new-seed-beats-memory) explains what switching does.

## How a rule seed generates every manual page

A rule seed generates the manual one module at a time. Each module has its own rule generator. The seed starts a random number stream, each module gets its own branch of that stream, and the module's generator proposes rule sets until one passes a solvability check. The result is the same every time for that seed.

Here is the process for one seed, in order:

1. **The seed starts a stream.** The engine creates a deterministic random number generator keyed to the seed. Deterministic means the same seed always produces the same sequence of numbers.
2. **Each module gets its own branch.** The stream is forked once per module, keyed by the module's name. Wires draws from one branch, Big Button from another, and so on. A change to one module's generator does not disturb the numbers another module receives.
3. **The generator proposes rules.** A module's `generateRules` function draws from its branch to build a candidate rule set. For Wires, that means a list of conditions and cuts for each number of wires.
4. **The candidate is tested.** The candidate must pass the module's own checks. The main one is `checkModuleSolvable`, which plays 1,000 random bombs against the rules by following the module's own hints. Every regular module must reach solved without a strike. Every needy module must survive.
5. **A failed candidate is replaced.** If the candidate fails, the generator tries again on a fresh branch of the same stream. Because those tries are keyed too, the accepted rule set is still a pure function of the seed.
6. **The pages are drawn.** The accepted rules for all 14 modules form the rule book, and the manual page turns that data into the sentences and tables an Expert reads.

Seeds run from 1 to 999,999. The engine builds a seed's rule book the first time it is asked for and keeps it after that. The web manual for seed 1 is built ahead of time. Any other seed is generated when someone first opens its page.

The check in step 4 matters more than it looks. The engine's own comment on it says a rule set that fails there would print a manual that lies. Playing a thousand bombs per module is how the project makes sure every generated manual can be followed to a defusal.

For a tour of how the resulting pages are arranged, from the opening instructions through the appendix, see [how every page of the bomb game manual is organized](/blog/the-bomb-game-manual-how-pages-are-organized).

## Why is seed 1 the standard manual?

Seed 1 is the standard manual because it is the shared starting point. Freeplay starts on it, nineteen of the twenty missions use it, and the how-to-play page tells new players to start there. It is also stored differently: its rules are frozen as data files, so they never move when a generator is changed.

Every other seed depends on the generator code. If a developer improves a module's generator, the rules for seed 7 or seed 500 may come out differently afterwards. That is acceptable for a seed a group picked on a whim. It is not acceptable for the manual that missions, printed copies and leaderboard runs depend on.

So the engine treats seed 1 as a special case. The README describes it this way: each module generates its rules from the seed and is accepted only after `checkModuleSolvable` plays 1,000 random bombs, and seed 1 is frozen as JSON in `packages/engine/src/rules/seed-1/`. When the engine builds the rule book for seed 1, it reads those files instead of running the generators.

The practical effect for players is stability. A stack of pages printed from [the standard manual](/manual/1) keeps its rules even after a module's generator is changed, so it still matches a seed 1 bomb. A group that has learned some of seed 1 can rely on that knowledge across sessions.

The open source guide explains [why the standard rules are frozen as data](/blog/open-source-games-how-a-replay-proves-a-defusal#why-the-standard-rules-are-frozen-as-data) and how that ties in to replaying runs. For the wider picture of how the server checks a run, read [how a replay proves a defusal](/blog/open-source-games-how-a-replay-proves-a-defusal).

## Checking the manual and the bomb share a seed

To check that the manual and the bomb share a seed, find the number on each side and compare them before the timer starts. The manual shows its seed at the top of the opening page and in its opening paragraph. The bomb side shows the seed on the setup screen, the room screen or the mission listing.

Where the number appears on each side:

| Where you look                  | What it shows                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Manual, top of the opening page | "Bomb Appétit · manual" followed by the seed, with "(standard)" after it for seed 1               |
| Manual, opening paragraph       | "This is manual number" followed by the seed, with a reminder to check the bomb uses the same one |
| Manual, address bar             | The seed at the end of the address, such as `/manual/1`                                           |
| Freeplay setup on one device    | A field labelled "Manual (rule seed)" and a button reading "Open manual" with the number          |
| Online room                     | A line telling the Defuser which manual the Experts will use                                      |
| Missions page                   | Each mission's details, ending with "manual" and its seed                                         |

In an online room, the check is mostly done for you. The room has one rule seed. When the host picks a mission, the room takes that mission's seed, and the Experts' screen loads the manual for it. The Defuser's screen gets the bomb. Experts never receive the bomb; they get the rule seed and a status line.

In the same room with one device, or with paper, nobody does the check for you. The Defuser reads the number from the setup screen. Each Expert reads the number from their page. If any Expert's number is different, stop and fix it before the round.

## What stays the same across seeds, and what changes?

Across seeds, the structure stays the same and the content changes. Every manual has the same modules in the same order, the same opening page, the same edgework appendix and glossary, and each module page follows the same shape. What changes is inside those pages: the conditions, the orders and the answers each rule gives.

What stays the same for every seed:

- The 14 modules: 11 regular and 3 needy, in the same catalog order.
- The opening page, the edgework appendix and the glossary.
- The explanation at the top of each module page, which tells the Expert how to read it.
- The way each page is laid out, such as a list per case, read from the top.
- The edgework itself: serial number, batteries, indicators and ports.
- The timer, the strikes and the controls on the bomb.

What changes from seed to seed is the rule content. The table below uses the Wires page as an example. It describes the kind of change between seed 1 and another seed, here seed 7. It does not quote either manual's rules.

| Part of the Wires page | Seed 1 (example)                                                                            | Seed 7 (example)                                                                            | Moved?    |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------- |
| Opening explanation    | Three to six wires, one to cut, read each list from the top and stop at the first true line | Same text                                                                                   | No        |
| Lists by wire count    | One list each for 3, 4, 5 and 6 wires                                                       | Same four lists                                                                             | No        |
| Lines per list         | Three or four if-lines, then an otherwise line                                              | Three or four if-lines, then an otherwise line, possibly a different number                 | Sometimes |
| What a line checks     | A condition such as how many wires of one color there are                                   | A different condition, such as the color of the last wire or the serial number's last digit | Yes       |
| Which wire to cut      | A target such as a numbered position                                                        | A different target, such as the first or last wire of a color                               | Yes       |
| Order of lines         | Lines in one order                                                                          | Lines in a different order, so a different line can match first                             | Yes       |
| Otherwise line         | Present at the end of each list                                                             | Present, possibly pointing to a different wire                                              | Yes       |

The Wires page shows why a familiar layout can mislead. An Expert reading seed 7 sees a page that looks exactly like seed 1: four lists, short if-lines, color names in bold. Only the details inside each line differ, and those details decide which wire gets cut.

The bomb has a seed of its own. A second number, the bomb seed, deals the bomb: which modules land on the case, in what order, and the edgework printed on its sides. The rule seed decides what the manual says about those modules. Online, the server sends the bomb seed to the Defuser only.

## The seed mistake: Experts on seed 1 while the bomb is on seed 7

The seed mistake happens when Experts read the standard manual while the bomb was set up with a different seed. Nothing on the page looks wrong. The module names match and the layout matches, so the Experts give confident instructions from the wrong rules. Strikes follow, and the team blames its own reading instead of the seed.

How it usually happens:

- Someone changed the freeplay seed to try something new, and the Experts opened the standard manual from a bookmark.
- A printed stack from seed 1 sat on the table when the group picked the final mission, which uses seed 2026.
- One Expert had an old tab open on a different manual while the others switched.

How to spot it during a round:

- The first instruction an Expert gives causes a strike on a module that seemed simple.
- A second Expert, reading the same module, reaches a different answer.
- The Defuser describes something the manual's lists cannot match cleanly.

When any of those happens, pause and read the seed numbers aloud from both sides. If they differ, the round is already compromised. Start a new bomb with the right manual open rather than trying to recover.

The fix is a habit, not a feature. Before every round, the Defuser says the manual number and each Expert repeats the number on their page. It takes five seconds. Groups that change seeds often can read [when a group should switch to a new seed](/blog/replayable-party-games-new-seed-beats-memory#when-should-a-group-switch-to-a-new-seed) for advice on timing the switch so this mistake is less likely.
