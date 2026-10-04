import type { BombSpec } from "@bombappetit/engine";
import { z } from "zod";
import { freeplaySchema, type FreeplayConfig } from "./freeplay";
import type { GameStatus } from "./realtime/adapter";

// No I or O: they read as 1 and 0 when a code is said aloud.
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const roomCodeSchema = z.string().regex(/^[A-HJ-NP-Z]{5}$/);

export const MAX_EXPERTS = 4;
export const ROOM_LIFETIME_MS = 6 * 60 * 60 * 1000;

export type RoomRole = "defuser" | "expert";

export type RoomSetup = { kind: "mission"; missionId: string } | { kind: "freeplay"; config: FreeplayConfig };

export const roomSetupSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("mission"), missionId: z.string().max(64) }),
  z.object({ kind: z.literal("freeplay"), config: freeplaySchema }),
]);

export interface RoomPlayer {
  id: string;
  name: string;
  role: RoomRole;
}

export interface RoomResult {
  runId: string;
  result: string;
  reason: string;
  timeRemainingMs: number;
  strikes: number;
  verified: boolean;
}

/** What one player is allowed to know about a room. Built per viewer by the server. */
export interface RoomView {
  code: string;
  status: "lobby" | "armed" | "ended";
  hostId: string;
  players: RoomPlayer[];
  setup: RoomSetup;
  /** Which manual the Experts open. Public to the whole room. */
  ruleSeed: number;
  startedAt: string | null;
  lastStatus: GameStatus | null;
  lastResult: RoomResult | null;
  you: { id: string; role: RoomRole; isHost: boolean } | null;
  /** The bomb itself. Present only for the Defuser while a game is armed. */
  defuser: { spec: BombSpec; ticket: string } | null;
}

export const roomOpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("join"), name: z.string() }),
  z.object({ op: z.literal("role"), role: z.enum(["defuser", "expert"]) }),
  z.object({ op: z.literal("setup"), setup: roomSetupSchema }),
  z.object({ op: z.literal("start") }),
  z.object({
    op: z.literal("status"),
    status: z.object({
      remainingMs: z.int().min(0).max(4_000_000),
      strikes: z.int().min(0).max(5),
      strikeLimit: z.int().min(1).max(5),
      solved: z.int().min(0).max(23),
      total: z.int().min(1).max(23),
      needyActive: z.boolean(),
    }),
  }),
  z.object({ op: z.literal("reset") }),
  z.object({ op: z.literal("leave") }),
]);

export type RoomOp = z.infer<typeof roomOpSchema>;
