---
title: "Multiplayer Browser Games to Play With Friends Far Apart"
description: "Multiplayer browser games to play with friends far apart: a room with a five-letter code, roles that lock, and screens that show each player only their part."
category: playing-online
primaryKeyword: "multiplayer browser games to play with friends"
secondaryKeywords:
  ["browser games to play with friends", "games for friends online", "online games to play with friends"]
length: full
tags: ["online rooms", "browser games", "friends"]
author: bombappetit
draft: false
---

Multiplayer browser games to play with friends work from different places because a server, not an installed program, links everyone's tabs. In Bomb Appétit the host creates a room, shares a five-letter code, and each friend joins from their own browser. The server then gives each player only their part: the bomb for one, the manual for the rest.

## What multiplayer browser games to play with friends need from a browser

Multiplayer browser games to play with friends need surprisingly little: a recent browser, a network connection and a separate way to talk. Bomb Appétit runs in any recent version of Chrome, Firefox, Safari or Edge, on a computer, tablet or phone. There is nothing to download, so a friend can join seconds after receiving the code.

The browser does real work, though. The Defuser's browser runs the game engine itself, keeps the countdown and records every action with a timestamp. When the round ends, it sends that log to the server, which replays it with the same engine before trusting the result. The Experts' browsers have a lighter job: they show the manual and a status line.

Two choices help a browser cope. The bomb comes in 3D and 2D views, so a player on an older laptop or a small phone can pick whichever runs better. And the manual is a plain page that reads well on anything, which is why the Expert seat suits a phone.

What the browser does not provide is voice. The game has no voice chat of its own, so friends need a phone call, a video call or a voice app running alongside. For which call app to pick and how to arrange its window next to the game, see [setting up the Zoom call and the bomb room side by side](/blog/games-to-play-on-zoom-bomb-defusal#setting-up-the-zoom-call-and-the-bomb-room-side-by-side). The rest of this post assumes the call is already going.

## How a room code connects browsers far apart

A room code connects browsers far apart by giving everyone one short address on the game server. The host creates an online room, the server hands back a five-letter code, and friends type that code to join. The server then keeps every browser in the room current: who joined, who holds which role, and when the bomb starts.

Here is one full join, step by step, showing the screen each player is on. The names are examples: Ana hosts, Ben will defuse, and Cleo is an Expert.

1. **Ana creates the room.** Ana is on [the Play page](/play) and chooses to create a room. Ben and Cleo are on the call only, with no game open yet.
2. **Ana shares the code.** Ana's screen shows the room with its five-letter code. She types it into the call's chat or a text message. Ben and Cleo open the game in their browsers.
3. **Ben and Cleo join.** Each enters the code and lands in the same room as Ana. All three now see the room's player list on their own screens.
4. **Everyone picks a role.** Each player picks Defuser or Expert. Ben takes Defuser. Ana and Cleo pick Expert. The room allows one Defuser per bomb.
5. **Ana chooses the bomb.** As host, Ana picks a mission, such as First bite, the first one. The room now knows which manual the Experts need.
6. **Ana starts the bomb.** Ben's screen turns into the bomb, with the timer running. Ana's and Cleo's screens show the manual and a status line. Nobody else ever receives the bomb.

Typing the code beats saying it. Five letters spoken over a crackly call can turn into the wrong five, and a text or chat message avoids that. If a friend arrives late, they can join with the same code before the host starts the next bomb. A full room is the one limit to plan for: with one Defuser and up to four Experts, a sixth friend has to sit out a round and swap in for the next.

## Who is the Defuser in a room, and can the role change?

The Defuser is the one player in the room who picked the Defuser role, and only one player can hold it per bomb. Roles can change between rounds, so friends can take turns. Once the host starts the bomb, roles are locked until that round is over.

The lock is what keeps the game fair over a distance. In the same room, friends can see who is holding the laptop. Online, nothing physical stops someone from clicking the other role mid-round. Locking the roles while the bomb is armed means the Defuser stays the Defuser until the bomb is defused or goes off.

The Defuser has a different duty from the others in a room. Their browser is the one running the bomb and reporting its status to everyone else. That is why the Defuser should be the friend with the steadiest connection and the biggest screen, at least for the first rounds.

Taking turns is the best part of an evening. After each round, the next friend switches to Defuser and the previous one switches to Expert. Everyone hears what the bomb sounds like from both sides, and the Experts who have defused once ask much better questions.

## What an Expert sees in a browser room

An Expert in a browser room sees the manual and a status line: the time left, the strike count, the number of modules solved and whether a needy module is awake. An Expert never sees the bomb. The server sends the bomb only to the Defuser, so there is nothing to peek at even by accident.

That status line is enough to feel the pressure without giving anything away. When the Defuser makes a mistake, the strike count rises on every Expert's screen at once. When a module is solved, the solved count ticks up, which tells the Experts the Defuser is ready for the next one. When a needy module wakes, the Experts know someone needs to find its page fast.

The manual the Experts get matches the bomb. Every rule in it is generated from a number called the rule seed, and the room passes that seed to the Experts. Rule seed 1 is the standard manual, and you can open [manual 1](/manual/1) to see what an Expert reads. A different seed gives different rules, so the room settling the seed for everyone removes one of the classic setup mistakes.

With several Experts, the manual is easiest when it is divided. One Expert owns Wires and the Big Button, another owns the symbol and word modules, and so on. Nobody flips through pages hunting for something a teammate already found.

## Does a browser room need an account?

A browser room does not need an account. Guests can create a room, join one and play every mission. Signing in with GitHub only adds leaderboards and saved progress, so a group of friends trying the game for the first time can skip it entirely.

The leaderboards are the one place an account matters. Only signed-in players are ranked, and each player appears once per mission, by their best verified defusal. When a run includes Experts, the board names them beside the Defuser. A friend who wants a place on a board needs to sign in. A group that just wants to play does not.

There is no fee either. The game is free, and the full list of what a first round needs, from player count to screens, is in [what you need to start a free bomb defusal game](/blog/bomb-defusal-game-free-what-you-need). The short version: two to five people, a browser each, and a way to talk.

Some friends prefer to run the game themselves. The code is open source, and a copy on your own machine gives you the whole game for same-room play. Online rooms, saved runs and leaderboards on a local copy need a Postgres database. Running the game locally, from the first install to the dev server, is covered in [running the dev server for the first time](/blog/open-source-browser-games-run-locally#running-the-dev-server-for-the-first-time).

## The room mistake: two people both expecting to be the Defuser

The usual room mistake is two friends both assuming they will defuse. Only one can hold the role, so one of them clicks Defuser, the other gets stuck, and the call fills with "I thought I was doing it". Settle it out loud on the call before anyone opens the role picker.

The mistake has a cause. On a call, friends cannot see each other's screens, so each one assumes the obvious choice is theirs. The friend who suggested the game assumes they should defuse. The friend with the biggest screen assumes the same. Neither says so until the room refuses.

A simple rule ends it: the host names the Defuser for the first round, and after that the seat rotates in the order people joined. Write the order in the chat if the group is large.

A related slip is starting before the roles are settled. If the host starts the bomb while someone is still deciding, they spend the round in whatever role they last picked. Before starting, the host should ask each friend to say their role aloud, then press start.

Bomb Appétit works over any call app. For Apple users, [games to play on FaceTime with friends](/blog/games-to-play-on-facetime-with-friends) sets up a round with the call on a phone and the game on a laptop. For larger groups or work calls, [games to play on Zoom](/blog/games-to-play-on-zoom-bomb-defusal) shows a host's full setup list. The rules themselves, in five minutes, are on [the how-to-play page](/how-to-play).
