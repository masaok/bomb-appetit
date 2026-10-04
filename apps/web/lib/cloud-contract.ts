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
}

export type PlausibilityVerdict = { plausible: true } | { plausible: false; reasons: string[] };

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
}

export interface AdminRoomRow {
  code: string;
  status: string;
  players: number;
  createdAt: string;
  expiresAt: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  /** GitHub username. Null until the user signs in again after it started being stored. */
  login: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
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
  }>;
  runs(options: { flaggedOnly: boolean; limit: number } & AdminRunFilter): Promise<AdminRunRow[]>;
  rooms(limit: number, filter?: AdminRoomFilter): Promise<AdminRoomRow[]>;
  users(limit: number, filter?: AdminUserFilter): Promise<AdminUserRow[]>;
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
