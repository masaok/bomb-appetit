import { describe, expect, it } from "vitest";
import {
  act,
  advance,
  autoPlay,
  createRng,
  generateBomb,
  generateEdgework,
  remainingMs,
  replay,
  serialLastDigit,
  summarize,
  timerDigits,
  timerText,
  validateSpec,
  type BombSpec,
} from "../src";

const spec: BombSpec = {
  bombSeed: 42,
  ruleSeed: 1,
  timeLimitMs: 300_000,
  strikeLimit: 3,
  caseSize: "3x2",
  moduleCount: 3,
  modulePool: ["wires"],
  needyCount: 0,
  needyPool: [],
};

describe("rng", () => {
  it("gives the same stream for the same seed and a different one for another seed", () => {
    const draw = (seed: number) => Array.from({ length: 5 }, createRng(seed).next);
    expect(draw(7)).toEqual(draw(7));
    expect(draw(7)).not.toEqual(draw(8));
  });

  it("forks by label, not by how much the parent was used", () => {
    const a = createRng("x");
    const b = createRng("x");
    a.next();
    a.next();
    expect(a.fork("child").next()).toBe(b.fork("child").next());
  });

  it("keeps int() inside its inclusive bounds", () => {
    const rng = createRng("bounds");
    const seen = new Set(Array.from({ length: 500 }, () => rng.int(2, 4)));
    expect([...seen].sort()).toEqual([2, 3, 4]);
  });
});

describe("edgework", () => {
  it("always makes a 6-character serial ending in a digit", () => {
    for (let i = 0; i < 200; i++) {
      const e = generateEdgework(createRng(i));
      expect(e.serial).toMatch(/^[A-HJ-NP-Z0-9]{5}[0-9]$/);
      expect(serialLastDigit(e)).toBe(Number(e.serial[5]));
    }
  });
});

describe("timer display", () => {
  it.each([
    [300_000, "5:00"],
    [299_999, "4:59"],
    [60_000, "1:00"],
    [59_999, "59.9"],
    [4_230, "04.2"],
    [0, "00.0"],
  ])("%i ms shows %s", (ms, text) => {
    expect(timerText(ms)).toBe(text);
  });

  it("lists the digits on the display", () => {
    expect(timerDigits(254_000)).toEqual([4, 1, 4]);
  });
});

describe("bomb generation", () => {
  it("builds the identical bomb from the same seed 1,000 times", () => {
    const first = JSON.stringify(generateBomb(spec));
    for (let i = 0; i < 1000; i++) expect(JSON.stringify(generateBomb(spec))).toBe(first);
  });

  it("builds a different bomb from a different seed", () => {
    expect(JSON.stringify(generateBomb({ ...spec, bombSeed: 43 }))).not.toBe(
      JSON.stringify(generateBomb(spec)),
    );
  });

  it("puts one timer and every module in a slot", () => {
    const bomb = generateBomb(spec);
    expect(bomb.slots).toHaveLength(12);
    expect(bomb.slots.filter((s) => s.kind === "timer")).toHaveLength(1);
    expect(
      bomb.slots.filter((s) => s.kind === "module").map((s) => (s.kind === "module" ? s.index : -1)),
    ).toEqual([0, 1, 2]);
  });

  it("rejects a spec that does not fit the case", () => {
    expect(validateSpec({ ...spec, moduleCount: 12 })).toBe("too many modules for the case");
  });
});

describe("countdown", () => {
  it("runs at real time with no strikes", () => {
    expect(remainingMs(advance(generateBomb(spec), 10_000))).toBe(290_000);
  });

  it("explodes when the countdown reaches zero", () => {
    const end = advance(generateBomb(spec), 400_000);
    expect(end.phase).toEqual({ kind: "exploded", atMs: 300_000, cause: { kind: "time" } });
  });

  it("speeds up to x1.25 after one strike and x1.5 after two", () => {
    const bomb = generateBomb(spec);
    const wrong = (m: number) => {
      const correct = autoPlay(bomb).log.actions.find((a) => a.m === m)?.a as { index: number };
      return { type: "cut", index: correct.index === 0 ? 1 : 0 };
    };
    const one = act(bomb, { t: 0, m: 0, a: wrong(0) });
    expect(one.strikes).toBe(1);
    expect(remainingMs(advance(one, 8_000))).toBe(290_000);
    const two = act(one, { t: 8_000, m: 1, a: wrong(1) });
    expect(two.strikes).toBe(2);
    expect(remainingMs(advance(two, 18_000))).toBe(275_000);
  });

  it("explodes on the last strike and names the module", () => {
    const bomb = generateBomb({ ...spec, strikeLimit: 1 });
    const correct = autoPlay(bomb).log.actions[0]?.a as { index: number };
    const end = act(bomb, { t: 1_000, m: 0, a: { type: "cut", index: correct.index === 0 ? 1 : 0 } });
    expect(end.phase).toEqual({ kind: "exploded", atMs: 1_000, cause: { kind: "strikes", moduleIndex: 0 } });
    expect(summarize(end).reason).toBe("Strike 1 on Wires");
  });
});

describe("replay", () => {
  it("reproduces a recorded run exactly", () => {
    const played = autoPlay(generateBomb(spec));
    expect(played.state.phase.kind).toBe("defused");
    const replayed = replay(spec, JSON.parse(JSON.stringify(played.log)));
    expect(replayed).toEqual({ ok: true, state: played.state });
  });

  it("rejects actions that are out of order or malformed", () => {
    expect(
      replay(spec, {
        actions: [
          { t: 5, m: 0, a: { type: "cut", index: 0 } },
          { t: 4, m: 0, a: { type: "cut", index: 1 } },
        ],
        endMs: 10,
      }),
    ).toEqual({
      ok: false,
      error: "action 1 is malformed or out of order",
    });
    expect(replay(spec, { actions: [{ t: 5, m: 0, a: { type: "explode" } }], endMs: 10 })).toEqual({
      ok: false,
      error: "action 0 is not valid for its module",
    });
    expect(replay(spec, { actions: [{ t: 5, m: 9, a: { type: "cut", index: 0 } }], endMs: 10 }).ok).toBe(
      false,
    );
  });

  it("reports a run that stopped early as abandoned", () => {
    const result = replay(spec, { actions: [], endMs: 1_000 });
    expect(result.ok && summarize(result.state).result).toBe("abandoned");
  });
});
