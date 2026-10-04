import "server-only";
import { sql } from "drizzle-orm";
import type { Db } from "@/db/client";

/**
 * Sets a player's `mission_progress` row to what their saved runs say: the best verified
 * defusal, or no row when there is none. Called after a run is saved and after every
 * moderation action, so the stored best can go down as well as up.
 */
export async function refreshProgress(db: Db, playerId: string, missionId: string): Promise<void> {
  await db.execute(sql`
    with best as (
      select time_remaining_ms, created_at from runs
      where defuser_id = ${playerId}::uuid and mission_id = ${missionId}
        and verified and result = 'defused'
      order by time_remaining_ms desc, created_at asc
      limit 1
    ),
    gone as (
      delete from mission_progress
      where player_id = ${playerId}::uuid and mission_id = ${missionId}
        and not exists (select 1 from best)
    )
    insert into mission_progress (player_id, mission_id, best_time_ms, completed_at)
    select ${playerId}::uuid, ${missionId}, time_remaining_ms, created_at from best
    on conflict (player_id, mission_id) do update
      set best_time_ms = excluded.best_time_ms, completed_at = excluded.completed_at`);
}
