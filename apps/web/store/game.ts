"use client";

import {
  act,
  advance,
  generateBomb,
  replay,
  type BombSpec,
  type BombState,
  type LoggedAction,
  type RunLog,
} from "@bombappetit/engine";
import { create } from "zustand";

/** What the server handed out when the run started. `token` is returned unchanged on submit. */
export interface RunTicket {
  token: string;
  /** Names the place this run was started from, so a refresh resumes it instead of dealing a new bomb. */
  resumeKey: string;
}

interface SavedRun {
  spec: BombSpec;
  ticket: RunTicket;
  actions: LoggedAction[];
  startedAtEpochMs: number;
}

type Game =
  | { kind: "idle" }
  | { kind: "running"; bomb: BombState; ticket: RunTicket; actions: LoggedAction[]; startedAtEpochMs: number }
  | { kind: "ended"; bomb: BombState; ticket: RunTicket; log: RunLog };

interface GameStore {
  game: Game;
  arm(spec: BombSpec, ticket: RunTicket): void;
  /** Rebuilds a run after a page refresh from the saved action log. */
  restore(resumeKey: string): boolean;
  dispatch(moduleIndex: number, action: unknown): void;
  /** Moves the bomb's clock to now. Called by the game loop. */
  tick(): void;
  reset(): void;
}

const STORAGE_KEY = "ba:run";

function save(run: SavedRun | null) {
  try {
    if (run) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(run));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be full or blocked. The run still plays; it just cannot survive a refresh.
  }
}

function load(): SavedRun | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedRun) : null;
  } catch {
    return null;
  }
}

const elapsedSince = (startedAtEpochMs: number) => Math.max(0, Math.round(Date.now() - startedAtEpochMs));

function settle(
  bomb: BombState,
  ticket: RunTicket,
  actions: LoggedAction[],
  startedAtEpochMs: number,
): Game {
  if (bomb.phase.kind === "armed") return { kind: "running", bomb, ticket, actions, startedAtEpochMs };
  save(null);
  return { kind: "ended", bomb, ticket, log: { actions, endMs: bomb.elapsedMs } };
}

export const useGame = create<GameStore>((set, get) => ({
  game: { kind: "idle" },

  arm(spec, ticket) {
    const startedAtEpochMs = Date.now();
    save({ spec, ticket, actions: [], startedAtEpochMs });
    set({ game: { kind: "running", bomb: generateBomb(spec), ticket, actions: [], startedAtEpochMs } });
  },

  restore(resumeKey) {
    const saved = load();
    if (!saved || saved.ticket.resumeKey !== resumeKey) return false;
    const endMs = elapsedSince(saved.startedAtEpochMs);
    const result = replay(saved.spec, { actions: saved.actions, endMs: Math.min(endMs, saved.spec.timeLimitMs + 60_000) });
    if (!result.ok) return false;
    set({ game: settle(result.state, saved.ticket, saved.actions, saved.startedAtEpochMs) });
    return true;
  },

  dispatch(moduleIndex, action) {
    const { game } = get();
    if (game.kind !== "running") return;
    const logged = { t: Math.max(elapsedSince(game.startedAtEpochMs), game.bomb.elapsedMs), m: moduleIndex, a: action };
    const actions = [...game.actions, logged];
    save({ spec: game.bomb.spec, ticket: game.ticket, actions, startedAtEpochMs: game.startedAtEpochMs });
    set({ game: settle(act(game.bomb, logged), game.ticket, actions, game.startedAtEpochMs) });
  },

  tick() {
    const { game } = get();
    if (game.kind !== "running") return;
    const bomb = advance(game.bomb, elapsedSince(game.startedAtEpochMs));
    if (bomb !== game.bomb) set({ game: settle(bomb, game.ticket, game.actions, game.startedAtEpochMs) });
  },

  reset() {
    save(null);
    set({ game: { kind: "idle" } });
  },
}));
