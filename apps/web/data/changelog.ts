export type ChangelogEntry = {
  version: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  title: string;
  items: string[];
};

/** Newest entry first. */
export const changelog: ChangelogEntry[] = [
  {
    version: "0.2.0",
    date: "2026-10-03",
    title: "Leaderboards that show where you stand",
    items: [
      "Each player is listed once per mission, by their best verified defusal.",
      'Your rank as a percentile, such as "Top 12%", on the missions page, the results page and your dashboard.',
      "Your own row is pinned under the table when you are further down the board.",
      "Experts are named beside the Defuser, with a filter for solo runs and runs with Experts.",
      "Only signed-in players are ranked. Guests can still play everything.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-10-03",
    title: "First playable version",
    items: [
      "11 modules to solve and 3 needy modules to keep happy.",
      "A seeded manual. Change the rule seed and every rule changes.",
      "Missions with set bombs, plus freeplay where you build your own.",
      "Online rooms with five-letter codes for playing far apart.",
      "Leaderboards. The server replays every run before it is listed.",
      "3D and 2D bomb views. Pick whichever your device likes better.",
    ],
  },
];
