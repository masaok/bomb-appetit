import { describe, expect, it } from "vitest";
import {
  autoPlay,
  generateBomb,
  NEEDY_MODULE_IDS,
  REGULAR_MODULE_IDS,
  replay,
  summarize,
  type BombSpec,
} from "../src";

const theWorks = (bombSeed: number, ruleSeed: number): BombSpec => ({
  bombSeed,
  ruleSeed,
  timeLimitMs: 20 * 60_000,
  strikeLimit: 3,
  caseSize: "4x3",
  moduleCount: 11,
  modulePool: REGULAR_MODULE_IDS,
  needyCount: 3,
  needyPool: NEEDY_MODULE_IDS,
});

describe("a bomb with one of every module", () => {
  it("has all 11 regular and 3 needy modules", () => {
    expect([REGULAR_MODULE_IDS.length, NEEDY_MODULE_IDS.length]).toEqual([11, 3]);
    const ids = generateBomb(theWorks(1, 1))
      .modules.map((m) => m.id)
      .sort();
    expect(ids).toEqual([...REGULAR_MODULE_IDS, ...NEEDY_MODULE_IDS].sort());
  });

  it.each([
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 7],
    [5, 2026],
    [6, 31337],
  ])(
    "bomb seed %i with rule seed %i is defused without a strike by following the hints",
    (bombSeed, ruleSeed) => {
      const spec = theWorks(bombSeed, ruleSeed);
      const played = autoPlay(generateBomb(spec));
      expect(summarize(played.state)).toMatchObject({ result: "defused", strikes: 0 });

      const replayed = replay(spec, JSON.parse(JSON.stringify(played.log)));
      expect(replayed).toEqual({ ok: true, state: played.state });
    },
  );

  it("explodes from needy strikes alone when nobody touches it", () => {
    const spec = { ...theWorks(9, 1), strikeLimit: 2 };
    const result = replay(spec, { actions: [], endMs: 10 * 60_000 });
    if (!result.ok) throw new Error(result.error);
    expect(result.state.phase.kind === "exploded" && result.state.phase.cause.kind).toBe("strikes");
    expect(result.state.strikes).toBe(2);
    expect(result.state.elapsedMs).toBeLessThan(3 * 60_000);
  });
});
