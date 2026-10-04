import "server-only";
import { ENGINE_VERSION, MODULES, replay, summarize, type RunSummary } from "@bombappetit/engine";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { missionProgress, roomPlayers, rooms, runs } from "@/db/schema";
import { cloud } from "@/lib/cloud";
import { roomChannel } from "@/lib/realtime/adapter";
import { realtime } from "@/lib/realtime/server";
import type { Player } from "./player";
import { readTicket } from "./tickets";

export type SubmitResult =
  | { ok: true; summary: RunSummary; verified: boolean; runId: string | null }
  | { ok: false; status: number; error: string };

/**
 * Accepts a finished run. The client's claim about the outcome is never read: the
 * server replays the action log on the bomb its own ticket describes and stores what
 * the replay says. `verified` additionally needs the private plausibility checks to pass.
 */
export async function submitRun(ticketToken: string, log: unknown, player: Player | null): Promise<SubmitResult> {
  const ticket = readTicket(ticketToken);
  if (!ticket) return { ok: false, status: 400, error: "This run ticket is not valid." };

  const replayed = replay(ticket.spec, log);
  if (!replayed.ok) return { ok: false, status: 400, error: `The run log does not replay: ${replayed.error}.` };
  const state = replayed.state;
  const summary = summarize(state);

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
  });
  const verified = verdict.plausible && summary.result !== "abandoned";

  const db = getDb();
  if (!db) return { ok: true, summary, verified, runId: null };

  const [room] = ticket.roomCode ? await db.select().from(rooms).where(eq(rooms.code, ticket.roomCode)) : [];
  const experts = room
    ? await db
        .select({ id: roomPlayers.playerId })
        .from(roomPlayers)
        .where(and(eq(roomPlayers.roomId, room.id), eq(roomPlayers.role, "expert")))
    : [];

  const [inserted] = await db
    .insert(runs)
    .values({
      ticketId: ticket.id,
      roomId: room?.id ?? null,
      missionId: ticket.missionId,
      defuserId: player?.id ?? null,
      defuserName: player?.name ?? "Anonymous",
      expertIds: experts.map((e) => e.id),
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
    })
    .onConflictDoNothing({ target: runs.ticketId })
    .returning({ id: runs.id });

  if (!inserted) {
    // The ticket was already redeemed. Report the stored run instead of saving a second one.
    const [existing] = await db.select({ id: runs.id, verified: runs.verified }).from(runs).where(eq(runs.ticketId, ticket.id));
    return { ok: true, summary, verified: existing?.verified ?? false, runId: existing?.id ?? null };
  }

  if (verified && summary.result === "defused" && ticket.missionId && player) {
    await db
      .insert(missionProgress)
      .values({ playerId: player.id, missionId: ticket.missionId, bestTimeMs: summary.timeRemainingMs })
      .onConflictDoUpdate({
        target: [missionProgress.playerId, missionProgress.missionId],
        set: {
          bestTimeMs: sql`greatest(${missionProgress.bestTimeMs}, excluded.best_time_ms)`,
          completedAt: sql`case when excluded.best_time_ms > ${missionProgress.bestTimeMs} then now() else ${missionProgress.completedAt} end`,
        },
      });
  }

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

  return { ok: true, summary, verified, runId: inserted.id };
}
