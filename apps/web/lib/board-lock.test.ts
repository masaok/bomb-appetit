import { describe, expect, it } from "vitest";
import lockFile from "@/data/missions/board-lock.json" with { type: "json" };
import { lockProblems, relock, type BoardLock } from "./board-lock";
import { MISSIONS, type Mission } from "./missions";

const lock = lockFile as BoardLock;
const first = MISSIONS[0]!;
const withFirst = (change: Partial<Mission>) => [{ ...first, ...change }, ...MISSIONS.slice(1)];

describe("the board lock", () => {
  it("matches the missions as committed", () => {
    expect(lockProblems(MISSIONS, lock)).toEqual([]);
  });

  it("fires when a ranked field changes without a new epoch", () => {
    for (const change of [
      { timeLimitMs: first.timeLimitMs + 1000 },
      { strikeLimit: first.strikeLimit - 1 },
      { modulePool: [...first.modulePool, "big-button"] as Mission["modulePool"] },
      { ruleSeed: first.ruleSeed + 1 },
    ]) {
      const problems = lockProblems(withFirst(change), lock);
      expect(problems).toHaveLength(1);
      expect(problems[0]).toContain(`${first.id}: ${Object.keys(change)[0]} changed`);
      expect(problems[0]).toContain(`Raise its boardEpoch to ${first.boardEpoch + 1}`);
    }
  });

  it("does not fire for a change to the title or the blurb", () => {
    expect(lockProblems(withFirst({ title: "Renamed", blurb: "Reworded." }), lock)).toEqual([]);
  });

  it("fires when an epoch is raised but not locked, and when one goes back", () => {
    expect(lockProblems(withFirst({ boardEpoch: first.boardEpoch + 1 }), lock)[0]).toContain("boards:lock");
    const raised = relock(withFirst({ boardEpoch: 2 }), lock);
    expect(lockProblems(withFirst({ boardEpoch: 1 }), raised)[0]).toContain("Epochs only go up");
  });

  it("fires for a mission that is missing from the lock, or from the missions", () => {
    const rest = Object.fromEntries(Object.entries(lock).filter(([id]) => id !== first.id));
    expect(lockProblems(MISSIONS, rest)[0]).toContain("not in the board lock");
    expect(lockProblems(MISSIONS.slice(1), lock)[0]).toContain("no longer a mission");
  });

  it("re-locking records a new epoch but cannot hide a change made without one", () => {
    const sneaky = withFirst({ timeLimitMs: first.timeLimitMs + 1000 });
    expect(lockProblems(sneaky, relock(sneaky, lock))).toHaveLength(1);

    const honest = withFirst({ timeLimitMs: first.timeLimitMs + 1000, boardEpoch: first.boardEpoch + 1 });
    expect(lockProblems(honest, relock(honest, lock))).toEqual([]);
  });
});
