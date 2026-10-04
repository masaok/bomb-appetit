import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  PASSCODE_WORD_POOL,
  passcode,
  passcodeShowing,
  passcodeTarget,
  type PasscodeRules,
  type PasscodeState,
} from "../../src/modules/passcode";
import { ctxFor } from "../helpers";

const rules: PasscodeRules = { words: ["BACON", "BAGEL", "LEMON", "MELON", "SALAD"] };

// Spells LEMON only: MELON needs M on the first wheel, BACON and BAGEL need B.
const wheels = [
  ["L", "X", "D", "Q", "Z", "S"],
  ["A", "E", "K", "U", "W", "Y"],
  ["T", "C", "R", "M", "G", "V"],
  ["P", "O", "E", "H", "D", "J"],
  ["F", "I", "N", "L", "T", "X"],
];
const state: PasscodeState = { wheels, showing: [0, 0, 0, 0, 0] };

describe("passcode rules", () => {
  it.each<[string, string[][], string | null]>([
    ["one listed word fits", wheels, "LEMON"],
    [
      "two listed words fit",
      wheels.map((w, i) =>
        i === 0 ? ["L", "M", "B", "Q", "Z", "S"] : i === 2 ? ["T", "C", "L", "M", "G", "V"] : w,
      ),
      null,
    ],
    ["no listed word fits", wheels.map((w, i) => (i === 4 ? ["F", "I", "A", "K", "T", "X"] : w)), null],
  ])("%s", (_name, candidate, expected) => {
    expect(passcodeTarget(rules, candidate)).toBe(expected);
  });

  it("reads the showing letters left to right", () => {
    expect(passcodeShowing(state)).toBe("LATPF");
    expect(passcodeShowing({ wheels, showing: [0, 1, 3, 1, 2] })).toBe("LEMON");
  });
});

describe("passcode module", () => {
  const ctx = ctxFor(rules);

  it("spins one wheel in either direction and wraps around", () => {
    expect(passcode.apply(state, { type: "spin", wheel: 1, dir: 1 }, ctx)).toEqual({
      state: { wheels, showing: [0, 1, 0, 0, 0] },
    });
    expect(passcode.apply(state, { type: "spin", wheel: 4, dir: -1 }, ctx)).toEqual({
      state: { wheels, showing: [0, 0, 0, 0, 5] },
    });
    expect(
      passcode.apply({ wheels, showing: [5, 0, 0, 0, 0] }, { type: "spin", wheel: 0, dir: 1 }, ctx),
    ).toEqual({
      state: { wheels, showing: [0, 0, 0, 0, 0] },
    });
  });

  it("solves when the listed word is showing", () => {
    const showing = { wheels, showing: [0, 1, 3, 1, 2] };
    expect(passcode.apply(showing, { type: "submit" }, ctx)).toEqual({ state: showing, solved: true });
  });

  it("strikes on any other submit and keeps the wheels", () => {
    const close = { wheels, showing: [0, 1, 3, 1, 3] };
    expect(passcode.apply(close, { type: "submit" }, ctx)).toEqual({ state: close, strike: true });
  });

  it("ignores a spin on a wheel that does not exist", () => {
    const short = { wheels: wheels.slice(0, 3), showing: [0, 0, 0] };
    expect(passcode.apply(short, { type: "spin", wheel: 4, dir: 1 }, ctx)).toEqual({ state: short });
  });

  it("hints the shortest spin toward the word, then submit", () => {
    expect(passcode.hint(state, ctx)).toEqual({ type: "spin", wheel: 1, dir: 1 });
    // wheel 3 needs M at index 3: three steps either way, forward wins the tie
    expect(passcode.hint({ wheels, showing: [0, 1, 0, 0, 0] }, ctx)).toEqual({
      type: "spin",
      wheel: 2,
      dir: 1,
    });
    // from index 5, O at index 1 is two forward (wrapping) or four back
    expect(passcode.hint({ wheels, showing: [0, 1, 3, 5, 0] }, ctx)).toEqual({
      type: "spin",
      wheel: 3,
      dir: 1,
    });
    // from index 3, O at index 1 is four forward or two back
    expect(passcode.hint({ wheels, showing: [0, 1, 3, 3, 0] }, ctx)).toEqual({
      type: "spin",
      wheel: 3,
      dir: -1,
    });
    expect(passcode.hint({ wheels, showing: [0, 1, 3, 1, 2] }, ctx)).toEqual({ type: "submit" });
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(passcode.parseAction({ type: "spin", wheel: 4, dir: -1, extra: 1 })).toEqual({
      type: "spin",
      wheel: 4,
      dir: -1,
    });
    expect(passcode.parseAction({ type: "submit", wheel: 9 })).toEqual({ type: "submit" });
    expect(passcode.parseAction({ type: "spin", wheel: 5, dir: 1 })).toBeNull();
    expect(passcode.parseAction({ type: "spin", wheel: 0, dir: 2 })).toBeNull();
    expect(passcode.parseAction({ type: "spin", wheel: 0 })).toBeNull();
    expect(passcode.parseAction({ type: "press" })).toBeNull();
    expect(passcode.parseAction("submit")).toBeNull();
  });

  it("has a pool of 70 distinct five-letter words", () => {
    expect(new Set(PASSCODE_WORD_POOL).size).toBe(70);
    for (const word of PASSCODE_WORD_POOL) expect(word).toMatch(/^[A-Z]{5}$/);
  });

  it("generates the same 35 sorted pool words for the same rule seed", () => {
    const a = passcode.generateRules(createRng("rules:77").fork("passcode"));
    expect(a).toEqual(passcode.generateRules(createRng("rules:77").fork("passcode")));
    expect(new Set(a.words).size).toBe(35);
    expect(a.words).toEqual([...a.words].sort());
    for (const word of a.words) expect(PASSCODE_WORD_POOL).toContain(word);
    expect(passcode.generateRules(createRng("rules:78").fork("passcode"))).not.toEqual(a);
  });

  it("generates wheels that spell exactly one listed word and do not start on it", () => {
    const generated = passcode.generateRules(createRng("rules:5").fork("passcode"));
    for (let i = 0; i < 200; i++) {
      const instance = passcode.generate(createRng(`bomb:${i}`), { edgework: ctx.edgework }, generated);
      expect(instance.wheels).toHaveLength(5);
      for (const wheel of instance.wheels) expect(new Set(wheel).size).toBe(6);
      const target = passcodeTarget(generated, instance.wheels);
      expect(generated.words).toContain(target);
      expect(passcodeShowing(instance)).not.toBe(target);
    }
  });

  it("plays 200 random instances to completion by following hints", () => {
    const generated = passcode.generateRules(createRng("rules:5").fork("passcode"));
    expect(checkModuleSolvable(passcode, generated, { samples: 200, seed: "play" })).toEqual({ ok: true });
  });
});
