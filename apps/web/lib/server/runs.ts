import "server-only";
import { ENGINE_VERSION, MODULES, replay, summarize, type RunSummary } from "@bombappetit/engine";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { roomPlayers, rooms, runs } from "@/db/schema";
import { cloud } from "@/lib/cloud";
import { missionById } from "@/lib/missions";
import { roomChannel } from "@/lib/realtime/adapter";
import { realtime } from "@/lib/realtime/server";
import { expireBoard } from "./board-cache";
import { candidate, standing, type Standing } from "./leaderboard";
import type { Player } from "./player";
import { refreshProgress } from "./progress";
import { readTicket } from "./tickets";

/**
 * Where a saved run stands on its leaderboard. `guest` means the run would be ranked if
 * the player signed in; null means it is not a ranked kind of run at all.
 */
export type RunStanding = Pick<Standing, "rank" | "total" | "topPercent"> | "guest" | null;

export type SubmitResult =
  | { ok: true; summary: RunSummary; verified: boolean; runId: string | null; standing: RunStanding }
  | { ok: false; status: number; error: string };

/**
 * Accepts a finished run. The client's claim about the outcome is never read: the
 * server replays the action log on the bomb its own ticket describes and stores what
 * the replay says. `verified` additionally needs the private plausibility checks to pass.
 */
export async function submitRun(
  ticketToken: string,
  log: unknown,
  player: Player | null,
): Promise<SubmitResult> {
  const ticket = readTicket(ticketToken);
  if (!ticket) return { ok: false, status: 400, error: "This run ticket is not valid." };

  const replayed = replay(ticket.spec, log);
  if (!replayed.ok)
    return { ok: false, status: 400, error: `The run log does not replay: ${replayed.error}.` };
  const state = replayed.state;
  const summary = summarize(state);

  const db = getDb();
  const [room] =
    db && ticket.roomCode ? await db.select().from(rooms).where(eq(rooms.code, ticket.roomCode)) : [];
  const experts =
    db && room
      ? await db
          .select({ id: roomPlayers.playerId, name: roomPlayers.displayName })
          .from(roomPlayers)
          .where(and(eq(roomPlayers.roomId, room.id), eq(roomPlayers.role, "expert")))
          .orderBy(roomPlayers.joinedAt)
      : [];

  // A run can be ranked when a signed-in user defused a mission. Freeplay has no board.
  const mission = ticket.missionId ? missionById(ticket.missionId) : undefined;
  const board =
    db && mission && player?.kind === "user" && summary.result === "defused"
      ? { missionId: mission.id, epoch: mission.boardEpoch }
      : null;
  const landing = db && board && player ? await candidate(db, board, player.id, summary) : null;

  const verdict = cloud.verifyRunPlausibility({
    engineVersion: ENGINE_VERSION,
    result: summary.result,
    timeLimitMs: ticket.spec.timeLimitMs,
    strikeLimit: ticket.spec.strikeLimit,
    strikes: summary.strikes,
    endMs: summary.elapsedMs,
    modules: state.modules.map((m) => ({ id: m.id, kind: MODULES[m.id].kind, solvedAtMs: m.solvedAtMs })),
    actions: (log as { actions: { t: number; m: number }[] }).actions.map(({ t, m }) => ({ t, m })),
    serverSeed: ticket.serverSeed,
    serverElapsedMs: Date.now() - ticket.issuedAt,
    teamSize: 1 + experts.length,
    board: landing && {
      rank: landing.boardRank,
      size: landing.boardSize,
      priorBestMs: landing.priorBestMs,
      priorAttempts: landing.priorAttempts,
    },
  });
  const verified = verdict.plausible && summary.result !== "abandoned";

  if (!db) return { ok: true, summary, verified, runId: null, standing: null };

  const [inserted] = await db
    .insert(runs)
    .values({
      ticketId: ticket.id,
      roomId: room?.id ?? null,
      missionId: ticket.missionId,
      defuserId: player?.id ?? null,
      defuserName: player?.name ?? "Anonymous",
      expertIds: experts.map((e) => e.id),
      expertNames: experts.map((e) => e.name),
      boardEpoch: mission?.boardEpoch ?? 1,
      bombSeed: ticket.spec.bombSeed,
      ruleSeed: ticket.spec.ruleSeed,
      engineVersion: ENGINE_VERSION,
      spec: ticket.spec,
      result: summary.result,
      reason: summary.reason,
      timeRemainingMs: summary.timeRemainingMs,
      strikes: summary.strikes,
      // `replay` accepted this log, which is what makes it a RunLog.
      actionLog: log as (typeof runs.$inferInsert)["actionLog"],
      verified,
      flags: verdict.plausible ? [] : verdict.reasons,
      review: verdict.plausible ? (verdict.review ?? []) : [],
    })
    .onConflictDoNothing({ target: runs.ticketId })
    .returning({ id: runs.id });

  if (!inserted) {
    // The ticket was already redeemed. Report the stored run instead of saving a second one.
    const [existing] = await db
      .select({ id: runs.id, verified: runs.verified })
      .from(runs)
      .where(eq(runs.ticketId, ticket.id));
    return {
      ok: true,
      summary,
      verified: existing?.verified ?? false,
      runId: existing?.id ?? null,
      standing: null,
    };
  }

  const defusedMission = verified && summary.result === "defused" && mission;
  if (defusedMission && player) await refreshProgress(db, player.id, mission.id);
  if (defusedMission && board) expireBoard(mission.id);
  const placed = defusedMission && board && player ? await standing(db, board, player.id) : null;
  const runStanding: RunStanding = placed
    ? { rank: placed.rank, total: placed.total, topPercent: placed.topPercent }
    : defusedMission && player?.kind !== "user"
      ? "guest"
      : null;

  if (room) {
    await db
      .update(rooms)
      .set({ status: "ended" })
      .where(and(eq(rooms.id, room.id), eq(rooms.roundId, ticket.id)));
    await realtime.publish(roomChannel(room.code), "game:end", {
      result: summary.result,
      reason: summary.reason,
      timeRemainingMs: summary.timeRemainingMs,
      runId: inserted.id,
    });
  }

  return { ok: true, summary, verified, runId: inserted.id, standing: runStanding };
}
