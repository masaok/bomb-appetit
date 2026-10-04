import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { getDb } from "@/db/client";
import { boardPage, type BoardRef, type BoardRow, type TeamFilter } from "./leaderboard";

/**
 * The public leaderboard pages read boards through this cache, so a visit does not
 * query the database. Whatever changes a board expires it: a new verified defusal, a
 * moderated run, or a user taken off the boards.
 */

const ALL_BOARDS = "boards";
const boardTag = (missionId: string) => `board:${missionId}`;

/** A safety net for a change that reached the database without passing through this app. */
const MAX_AGE_SECONDS = 600;

export function cachedBoardPage(
  board: BoardRef,
  team: TeamFilter,
  page: number,
): Promise<{ rows: BoardRow[]; total: number }> {
  return unstable_cache(
    async () => {
      const db = getDb();
      return db ? boardPage(db, board, { team, page }) : { rows: [], total: 0 };
    },
    ["board", board.missionId, String(board.epoch), team, String(page)],
    { tags: [ALL_BOARDS, boardTag(board.missionId)], revalidate: MAX_AGE_SECONDS },
  )();
}

// `expire: 0` makes the next visit wait for fresh rows instead of being served the old
// ones, so a player who just defused a bomb sees their run when the board loads.
const NOW = { expire: 0 };

/** One mission's boards changed. A null mission (freeplay) has no board. */
export function expireBoard(missionId: string | null): void {
  if (missionId) revalidateTag(boardTag(missionId), NOW);
}

/** Something that spans boards changed, such as a user being taken off all of them. */
export function expireAllBoards(): void {
  revalidateTag(ALL_BOARDS, NOW);
}
