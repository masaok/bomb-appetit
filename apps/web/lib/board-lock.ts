import type { Mission } from "./missions";

/**
 * Times on one leaderboard must be comparable. A change to any field below changes how
 * fast a mission can be played, so it has to come with a new board epoch, which starts a
 * fresh board and archives the old one. `data/missions/board-lock.json` records the
 * fields each epoch was opened with, and `lockProblems` compares the missions against it.
 */
const RANKED_FIELDS = [
  "caseSize",
  "timeLimitMs",
  "strikeLimit",
  "modulePool",
  "moduleCount",
  "needyPool",
  "needyCount",
  "fixedBombSeed",
  "ruleSeed",
] as const satisfies readonly (keyof Mission)[];

type RankedFields = Pick<Mission, (typeof RANKED_FIELDS)[number]>;

export type BoardLock = Record<string, { epoch: number; fields: RankedFields }>;

function rankedFields(mission: Mission): RankedFields {
  return Object.fromEntries(RANKED_FIELDS.map((key) => [key, mission[key]])) as RankedFields;
}

const changed = (mission: Mission, locked: RankedFields): string[] =>
  RANKED_FIELDS.filter((key) => JSON.stringify(mission[key]) !== JSON.stringify(locked[key]));

/** Every way the missions disagree with the lock. Empty means the boards are sound. */
export function lockProblems(missions: Mission[], lock: BoardLock): string[] {
  const problems: string[] = [];
  for (const mission of missions) {
    const locked = lock[mission.id];
    if (!locked) {
      problems.push(`${mission.id}: not in the board lock. Run \`pnpm boards:lock\`.`);
    } else if (mission.boardEpoch < locked.epoch) {
      problems.push(
        `${mission.id}: boardEpoch went from ${locked.epoch} back to ${mission.boardEpoch}. Epochs only go up.`,
      );
    } else if (mission.boardEpoch > locked.epoch) {
      problems.push(`${mission.id}: boardEpoch is now ${mission.boardEpoch}. Run \`pnpm boards:lock\`.`);
    } else if (changed(mission, locked.fields).length > 0) {
      problems.push(
        `${mission.id}: ${changed(mission, locked.fields).join(", ")} changed, so old and new times are not ` +
          `comparable. Raise its boardEpoch to ${locked.epoch + 1}, then run \`pnpm boards:lock\`.`,
      );
    }
  }
  const ids = new Set(missions.map((m) => m.id));
  for (const id of Object.keys(lock)) {
    if (!ids.has(id))
      problems.push(`${id}: in the board lock but no longer a mission. Run \`pnpm boards:lock\`.`);
  }
  return problems;
}

/**
 * The lock for the missions as they are now. It keeps an entry whose epoch has not moved,
 * so re-locking can record a new epoch but can never hide a change made without one.
 */
export function relock(missions: Mission[], lock: BoardLock): BoardLock {
  return Object.fromEntries(
    missions.map((mission) => {
      const locked = lock[mission.id];
      return [
        mission.id,
        locked && mission.boardEpoch <= locked.epoch
          ? locked
          : { epoch: mission.boardEpoch, fields: rankedFields(mission) },
      ];
    }),
  );
}
