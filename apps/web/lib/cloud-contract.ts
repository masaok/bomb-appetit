import type { ReactNode } from "react";

/**
 * The seam between this public repo and the private `@bombappetit/cloud` package.
 * The private package holds what loses value once published: anti-cheat thresholds,
 * licensed assets and the admin pages. This file is the whole interface; the stub in
 * `cloud-stub.ts` implements it for clones that have no access to the private repo.
 */

/** What the server knows about a run after replaying it. No module contents, only timing. */
export interface PlausibilityInput {
  engineVersion: string;
  result: "defused" | "exploded" | "abandoned";
  timeLimitMs: number;
  strikeLimit: number;
  strikes: number;
  /** Elapsed ms when the run ended, by the replayed engine clock. */
  endMs: number;
  /** One entry per module on the bomb, in bomb order. */
  modules: { id: string; kind: "regular" | "needy"; solvedAtMs: number | null }[];
  /** Every action's engine timestamp and target module, in log order. */
  actions: { t: number; m: number }[];
  /** True when the server chose the bomb seed, so the player could not preview the bomb. */
  serverSeed: boolean;
  /** Wall-clock ms between the server issuing the run ticket and receiving the log. */
  serverElapsedMs: number;
  /** The Defuser plus the Experts in the room. 1 is a solo run. */
  teamSize: number;
  /**
   * Where the run would land on its leaderboard. Null when it cannot be ranked: freeplay,
   * a guest, a run that was not a defusal, or a server with no database.
   */
  board: {
    /** The rank the run would take if it were listed. */
    rank: number;
    /** Players on the board, counting this one. */
    size: number;
    /** The player's best time left on this board before this run. Null if they had none. */
    priorBestMs: number | null;
    /** Runs the player had already saved on this mission, with any result. */
    priorAttempts: number;
  } | null;
}

/**
 * `review` lists reasons an admin should look at a run that still counts. A run that is
 * not plausible is saved with its reasons and kept off the leaderboards.
 */
export type PlausibilityVerdict =
  { plausible: true; review?: string[] } | { plausible: false; reasons: string[] };

export interface AdminRunRow {
  id: string;
  createdAt: string;
  missionId: string | null;
  defuserName: string;
  result: string;
  reason: string;
  timeRemainingMs: number;
  strikes: number;
  verified: boolean;
  flags: string[];
  /** Reasons the plausibility checks asked for a look. Empty once an admin has cleared them. */
  review: string[];
  /** The names of the Experts, as saved with the run. */
  expertNames: string[];
  /** The mission's board epoch when the run was played. */
  boardEpoch: number;
  engineVersion: string;
  bombSeed: number;
  ruleSeed: number;
  /** Number of actions in the saved log. */
  actionCount: number;
  expertCount: number;
  /** The room the run was played in. Null for solo runs and for rooms since deleted. */
  roomCode: string | null;
}

export interface AdminRoomRow {
  code: string;
  status: string;
  players: number;
  createdAt: string;
  expiresAt: string;
  missionId: string | null;
  startedAt: string | null;
  /** Everyone in the room, in the order they joined. */
  roster: { name: string; role: string }[];
}

export interface AdminUserRow {
  id: string;
  githubId: string;
  name: string;
  /** GitHub username. Null until the user signs in again after it started being stored. */
  login: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  /** False when an admin has taken the user off every leaderboard. */
  ranked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  /** Runs this user saved as the Defuser. */
  runs: number;
}

/** Narrowing for the admin tables. `search` is matched as text, never as a pattern. */
export interface AdminRunFilter {
  /** Matches the Defuser's name or the mission id. */
  search?: string;
  result?: "defused" | "exploded" | "abandoned";
  verified?: boolean;
  /** True keeps only the runs waiting for an admin's review. */
  review?: boolean;
}

/** One leaderboard, as the admin pages list it. */
export interface AdminBoard {
  missionId: string;
  title: string;
  /** The epoch new runs go on. Earlier epochs are archived. */
  epoch: number;
  /** Players on the current board. */
  players: number;
}

/** A leaderboard row with its run, so the admin page can show and moderate it. */
export interface AdminBoardRow extends AdminRunRow {
  rank: number;
  /** The ranked user's id, for taking them off the boards. */
  playerId: string;
}

export interface AdminRoomFilter {
  /** Matches the room code. */
  search?: string;
  status?: "lobby" | "armed" | "ended";
}

export interface AdminUserFilter {
  /** Matches the name, GitHub username or email. */
  search?: string;
  role?: "player" | "admin";
}

/** Read access the public app hands to the admin pages. Mutations go through `/api/admin/*`. */
export interface AdminStore {
  stats(): Promise<{
    users: number;
    guests: number;
    rooms: number;
    runs: number;
    verifiedRuns: number;
    flaggedRuns: number;
    /** Runs waiting for an admin's review. */
    reviewRuns: number;
  }>;
  runs(options: { flaggedOnly: boolean; limit: number } & AdminRunFilter): Promise<AdminRunRow[]>;
  rooms(limit: number, filter?: AdminRoomFilter): Promise<AdminRoomRow[]>;
  users(limit: number, filter?: AdminUserFilter): Promise<AdminUserRow[]>;
  /** Every mission's current leaderboard, in mission order. */
  boards(): Promise<AdminBoard[]>;
  /** The top of one mission's current leaderboard, best first. */
  board(missionId: string, limit: number): Promise<AdminBoardRow[]>;
}

export interface AdminAppProps {
  /** Path segments after `/admin`. */
  path: string[];
  /** The page's query string, one value per key. The admin tables keep their search and filters here. */
  query?: Record<string, string>;
  store: AdminStore;
  adminName: string;
}

export interface CloudSfx {
  src: string[];
  sprite: Record<string, [number, number]>;
}

export interface CloudModule {
  name: "stub" | "cloud";
  /** Proves humanity, where the engine replay only proves validity. */
  verifyRunPlausibility(input: PlausibilityInput): PlausibilityVerdict;
  /** Overrides for the CC0 placeholder assets. Empty means use the public defaults. */
  assetManifest: { sfx?: CloudSfx };
  AdminApp(props: AdminAppProps): ReactNode | Promise<ReactNode>;
}
