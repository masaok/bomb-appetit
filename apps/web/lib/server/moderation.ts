import "server-only";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { rooms, runs, users } from "@/db/schema";
import { roomCodeSchema } from "@/lib/rooms";
import { expireAllBoards, expireBoard } from "./board-cache";
import { refreshProgress } from "./progress";

/**
 * Admin moderation, written once. The routes for one row and for a selection of rows
 * both call these, so a bulk action does exactly what the same action does to one row.
 * Callers have already confirmed the viewer is an admin.
 */

/** The most rows one request may change. An admin table shows at most 100 at a time. */
export const MAX_BULK = 200;
export const idsSchema = z.array(z.uuid()).min(1).max(MAX_BULK);
/** Rooms are known to the admin pages by their code, so a selection of rooms is a list of codes. */
export const roomCodesSchema = z.array(roomCodeSchema).min(1).max(MAX_BULK);

const runChange = {
  /** Puts the runs on, or takes them off, the leaderboards. */
  verified: z.boolean().optional(),
  /** Clears the runs' review reasons: an admin has looked at them. */
  reviewed: z.literal(true).optional(),
};
type RunChange = { verified?: boolean; reviewed?: true };
const changesSomething = (body: RunChange) => body.verified !== undefined || body.reviewed === true;

export const runPatchSchema = z.object(runChange).refine(changesSomething, "Nothing to change.");
export const runBulkPatchSchema = z
  .object({ ids: idsSchema, ...runChange })
  .refine(changesSomething, "Nothing to change.");

const affected = { id: runs.id, defuserId: runs.defuserId, missionId: runs.missionId };
type Affected = { id: string; defuserId: string | null; missionId: string | null };

/** Moderated runs can change their players' best times and their missions' boards. Bring both up to date. */
async function settle(db: Db, changed: Affected[]): Promise<void> {
  const players = new Map<string, { defuserId: string; missionId: string }>();
  const boards = new Set<string | null>();
  for (const run of changed) {
    boards.add(run.missionId);
    if (run.defuserId && run.missionId) {
      players.set(`${run.defuserId} ${run.missionId}`, {
        defuserId: run.defuserId,
        missionId: run.missionId,
      });
    }
  }
  for (const { defuserId, missionId } of players.values()) await refreshProgress(db, defuserId, missionId);
  for (const missionId of boards) expireBoard(missionId);
}

/** Changes the runs that exist among `ids` and returns them. Unknown ids are skipped. */
export async function patchRuns(db: Db, ids: string[], change: RunChange) {
  const rows = await db
    .update(runs)
    .set({
      ...(change.verified === undefined ? {} : { verified: change.verified }),
      ...(change.reviewed ? { review: [] } : {}),
    })
    .where(inArray(runs.id, ids))
    .returning({ ...affected, verified: runs.verified });
  await settle(db, rows);
  return rows;
}

/** Deletes the runs that exist among `ids` and returns their ids. */
export async function deleteRuns(db: Db, ids: string[]): Promise<string[]> {
  const rows = await db.delete(runs).where(inArray(runs.id, ids)).returning(affected);
  await settle(db, rows);
  return rows.map((row) => row.id);
}

/**
 * Takes users off every leaderboard, or puts them back. Their runs and their mission
 * progress are untouched, so the change is undone by sending the opposite value.
 */
export async function setRanked(db: Db, ids: string[], ranked: boolean) {
  const rows = await db
    .update(users)
    .set({ ranked })
    .where(inArray(users.id, ids))
    .returning({ id: users.id, ranked: users.ranked });
  if (rows.length > 0) expireAllBoards();
  return rows;
}

/**
 * Deletes the rooms that exist among `codes` and returns their codes. Their players go
 * with them. Runs keep their history: `runs.room_id` is set to null when its room goes,
 * as it is when the nightly cleanup removes an expired room.
 */
export async function deleteRooms(db: Db, codes: string[]): Promise<string[]> {
  const rows = await db.delete(rooms).where(inArray(rooms.code, codes)).returning({ code: rooms.code });
  return rows.map((row) => row.code);
}
