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
