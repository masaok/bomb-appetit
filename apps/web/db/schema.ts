import type { BombSpec, RunLog } from "@bombappetit/engine";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { FreeplayConfig } from "@/lib/freeplay";
import type { GameStatus } from "@/lib/realtime/adapter";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubId: text("github_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").unique(),
  role: text("role", { enum: ["player", "admin"] })
    .notNull()
    .default("player"),
  createdAt,
});

/** Cookie-backed players who never signed in. */
export const guests = pgTable("guests", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name").notNull(),
  createdAt,
});

/** Mirror of data/missions/*.json, written by `pnpm db:seed`, so runs can be joined to missions in SQL. */
export const missions = pgTable("missions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  section: integer("section").notNull(),
  order: integer("order").notNull(),
  caseSize: text("case_size").notNull(),
  timeLimitMs: integer("time_limit_ms").notNull(),
  strikeLimit: integer("strike_limit").notNull(),
  modulePool: jsonb("module_pool").$type<string[]>().notNull(),
  needyPool: jsonb("needy_pool").$type<string[]>().notNull(),
  moduleCount: integer("module_count").notNull(),
  needyCount: integer("needy_count").notNull().default(0),
  fixedBombSeed: bigint("fixed_bomb_seed", { mode: "number" }),
  ruleSeed: integer("rule_seed").notNull().default(1),
});

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: char("code", { length: 5 }).notNull().unique(),
    hostId: uuid("host_id").notNull(),
    status: text("status", { enum: ["lobby", "armed", "ended"] })
      .notNull()
      .default("lobby"),
    missionId: text("mission_id"),
    freeplayConfig: jsonb("freeplay_config").$type<FreeplayConfig>(),
    bombSeed: bigint("bomb_seed", { mode: "number" }).notNull(),
    ruleSeed: integer("rule_seed").notNull().default(1),
    /** Identifies one game played in the room. Doubles as that game's run ticket id. */
    roundId: uuid("round_id").notNull().defaultRandom(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    lastStatus: jsonb("last_status").$type<GameStatus>(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt,
  },
  (t) => [index("rooms_expires_at_idx").on(t.expiresAt)],
);

export const roomPlayers = pgTable(
  "room_players",
  {
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    playerId: uuid("player_id").notNull(),
    role: text("role", { enum: ["defuser", "expert"] }).notNull(),
    displayName: text("display_name").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.roomId, t.playerId] }),
    // "Exactly one Defuser" is a database fact, not something two racing requests can both pass.
    uniqueIndex("room_players_one_defuser_idx")
      .on(t.roomId)
      .where(sql`${t.role} = 'defuser'`),
  ],
);

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** A ticket can be redeemed once, so a log cannot be submitted twice. */
    ticketId: uuid("ticket_id").notNull().unique(),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
    missionId: text("mission_id"),
    defuserId: uuid("defuser_id"),
    defuserName: text("defuser_name").notNull(),
    expertIds: uuid("expert_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    bombSeed: bigint("bomb_seed", { mode: "number" }).notNull(),
    ruleSeed: integer("rule_seed").notNull(),
    engineVersion: text("engine_version").notNull(),
    /** With the action log, everything needed to replay the run. */
    spec: jsonb("spec").$type<BombSpec>().notNull(),
    result: text("result", { enum: ["defused", "exploded", "abandoned"] }).notNull(),
    reason: text("reason").notNull(),
    timeRemainingMs: integer("time_remaining_ms").notNull(),
    strikes: integer("strikes").notNull(),
    actionLog: jsonb("action_log").$type<RunLog>().notNull(),
    /** True when the replay matched and the plausibility checks passed. Leaderboards read only these. */
    verified: boolean("verified").notNull().default(false),
    /** Why the plausibility checks objected. Shown to admins only. */
    flags: jsonb("flags").$type<string[]>().notNull().default([]),
    createdAt,
  },
  (t) => [index("runs_leaderboard_idx").on(t.missionId, t.verified, t.timeRemainingMs.desc())],
);

export const missionProgress = pgTable(
  "mission_progress",
  {
    playerId: uuid("player_id").notNull(),
    missionId: text("mission_id").notNull(),
    bestTimeMs: integer("best_time_ms").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.missionId] })],
);

/** Fixed-window request counters. Serverless instances share nothing in memory, so the count lives here. */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
  count: integer("count").notNull().default(1),
});
