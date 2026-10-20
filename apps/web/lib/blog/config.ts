// The blog's name, its categories, its author and its call to action. The pages,
// feeds and content rules read everything about the blog's shape from here.
import { GITHUB_URL } from "@/components/marketing/links";
import type { Author, CallToAction, Category } from "./schema";

export const SITE_NAME = "Bomb Appétit";
export const SITE_URL = "https://bombappetit.com";

export const blog = {
  name: "Bomb Appétit blog",
  description:
    "Guides for playing co-op bomb defusal with friends, family, classes and remote teams: setup, talking under pressure, the manual, missions and the open source game.",
  /** Colors of the generated social preview image. They match app/globals.css. */
  image: { background: "#221a38", foreground: "#fff6e9", accent: "#ffc94a" },
};

export const categories: Category[] = [
  {
    slug: "getting-started",
    name: "Getting started",
    description:
      "Your first game of Bomb Appétit: what the roles do, what you need, how a round runs and how to set up on laptops, phones and paper.",
    intro:
      "Getting started covers the first ten minutes with the game: what a Defuser and an Expert each see, what devices and people you need, how the timer and strikes work, and how to set up a bomb in the same room. Every post here assumes you have never played a bomb defusal game before. Start with How to Play a Bomb Defusal Game With Friends, which walks through one full round.",
  },
  {
    slug: "playing-online",
    name: "Playing online",
    description:
      "Playing far apart: online rooms and five-letter codes, voice and video calls, Discord and Zoom, and what Experts see when they are remote.",
    intro:
      "Playing online is about the game when the players are not in one room: creating a room, sharing its five-letter code, choosing a call app, and what each screen shows when the Defuser and the Experts are miles apart. The posts give setup steps for the common call apps and fixes for the usual hitches. Start with Online Games to Play With Friends on a Video Call, which sets up a remote round from scratch.",
  },
  {
    slug: "game-night",
    name: "Game night",
    description:
      "Hosting a game night with a bomb on the table: group sizes from two to five, quick rounds, adults-only nights, couples and what to play next.",
    intro:
      "Game night covers the evening around the game: how many people fit at one bomb, how long a round takes, how to run several rounds so everyone defuses once, and how a bomb defusal round fits beside other party games. The posts are written for the host. Start with Game Night Ideas for Adults That Need No Setup, which plans a whole evening around a browser and a phone.",
  },
  {
    slug: "remote-teams",
    name: "Remote teams",
    description:
      "Bomb defusal as a team building game for remote and hybrid teams: icebreakers, meeting games, rotating roles and what a manager learns from one round.",
    intro:
      "Remote teams covers using the game at work: as an icebreaker at the top of a call, as a team building activity for a distributed team, and as a way to watch how a group gives and takes instructions. The posts cover timing, group sizes, rotating the Defuser and what to debrief afterwards. Start with Virtual Team Building Games That Make Everyone Talk, which fits a round into a thirty-minute call.",
  },
  {
    slug: "families",
    name: "Families and kids",
    description:
      "Playing with the whole family: ages that work, kids as Experts, grandparents on a call, and keeping a round calm enough for everyone.",
    intro:
      "Families and kids covers playing across ages: which modules a younger Expert can read, how to give a child the Defuser role without a meltdown, playing with grandparents over a call, and how to keep a family round fun when the timer gets loud. The posts give role assignments by age and settings to use. Start with Family Game Night Ideas With One Screen and a Manual, which plans a round for mixed ages.",
  },
  {
    slug: "classrooms",
    name: "Classrooms",
    description:
      "Using the game to teach clear speaking and active listening: lesson plans, group rotations, what to observe and how to debrief students.",
    intro:
      "Classrooms covers the game as a communication exercise for students: how a round of bomb defusal makes precise description and active listening the only way to win, how to run it with a class of thirty in small groups, what to watch for and the questions to ask afterwards. The posts give timings and rotations. Start with Communication Skills Games for Students That Grade Themselves.",
  },
  {
    slug: "communication",
    name: "Communication",
    description:
      "Talking under pressure: describing what you see, giving one instruction at a time, repeating back, naming symbols and recovering from a strike.",
    intro:
      "Communication is about the words between the Defuser and the Experts. These posts cover how to describe a module so an Expert can find it in the manual, how to give an instruction that cannot be misheard, how to agree on names for symbols and colors, and how to recover when a strike lands. Each ends with phrases you can use in the next round. Start with How to Communicate Under Pressure Without Shouting.",
  },
  {
    slug: "modules-and-manual",
    name: "Modules and the manual",
    description:
      "Module by module: what each puzzle shows the Defuser, what its manual page asks, edgework, needy modules and how to read the manual fast.",
    intro:
      "Modules and the manual walks through the puzzles on the bomb one at a time: what the Defuser sees, what the Expert's page asks for, the edgework details that change the answer, and the needy modules that interrupt everything. The posts explain the structure of each page so an Expert can find the right line quickly. Start with Bomb Game With a Manual: How the Manual Is Organized.",
  },
  {
    slug: "missions-and-leaderboards",
    name: "Missions and leaderboards",
    description:
      "The missions, strikes and timer, verified runs, how the leaderboards rank players and how to get faster without getting sloppy.",
    intro:
      "Missions and leaderboards covers the structured side of the game: the mission list and what each one adds, how the timer and the strike limit shape a run, how the server verifies a run before it is listed, how ranks and percentiles work, and what actually makes a team faster. Start with Games With Leaderboards: How Bomb Appétit Ranks a Defusal.",
  },
  {
    slug: "printing-the-manual",
    name: "Printing the manual",
    description:
      "Playing with paper: printing the manual, playing with one screen, splitting pages between Experts and keeping the printed seed in sync.",
    intro:
      "Printing the manual covers the paper way to play: printing the manual from the browser, playing with one device and a stack of pages, dividing the pages between Experts, and making sure the printed rule seed matches the bomb. The posts explain the print layout and what happens when a seed changes. Start with Free Printable Game Manual: Playing Bomb Appétit on Paper.",
  },
  {
    slug: "rule-seeds",
    name: "Rule seeds",
    description:
      "How a rule seed generates the whole manual, why seed 1 is the standard, when to change seeds and what that does to memorized answers.",
    intro:
      "Rule seeds explains the number behind the manual: how one seed generates every rule, why seed 1 is the standard set, how changing the seed makes memorized answers wrong, and when a group should pick a new one. The posts show what changes and what stays the same across seeds. Start with Games With Random Rules: How a Rule Seed Rewrites the Manual.",
  },
  {
    slug: "open-source",
    name: "Open source",
    description:
      "The game as an open source project: the GitHub repository, how the engine replays runs, how to run it yourself and how to contribute.",
    intro:
      "Open source covers the project behind the game: where the code lives on GitHub, how the engine, the manual generator and the web app fit together, how the server replays a run to verify it, how to run the game locally and how to send a change. The posts are for players who are curious and developers who want in. Start with Open Source Party Games: How Bomb Appétit Is Built in Public.",
  },
];

export const authors: Author[] = [
  {
    slug: "bombappetit",
    name: SITE_NAME,
    kind: "organization",
    bio: "Bomb Appétit is a free co-op bomb defusal party game for the browser. One player sees the bomb, everyone else has the manual.",
    url: SITE_URL,
    sameAs: [GITHUB_URL],
  },
];

export const DEFAULT_AUTHOR = authors[0]!.slug;

export const cta: CallToAction = {
  heading: "Play Bomb Appétit for free",
  body: "Grab two to five people, open the bomb on one screen and the manual on another, and start talking. Nothing to install, no account needed.",
  label: "Play now",
  href: "/play",
};
