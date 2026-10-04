import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  blinker,
  blinkerCycleMs,
  blinkerDecode,
  blinkerFrequencyFor,
  blinkerLightOn,
  BLINKER_FREQUENCIES,
  BLINKER_WORDS,
  type BlinkerPulse,
  type BlinkerRules,
  type BlinkerState,
} from "../../src/modules/blinker";
import { ctxFor, edgework } from "../helpers";

const S: BlinkerPulse = "short";
const L: BlinkerPulse = "long";

const rules: BlinkerRules = {
  code: [
    { letter: "A", pulses: [S, L] },
    { letter: "B", pulses: [L] },
    { letter: "C", pulses: [S] },
    { letter: "D", pulses: [L, L, S] },
  ],
  words: [
    { word: "ABBA", frequency: 3 },
    { word: "CAB", frequency: 0 },
    { word: "DAD", frequency: 15 },
  ],
};

const AB: BlinkerPulse[][] = [[S, L], [L]];
const CAB: BlinkerPulse[][] = [[S], [S, L], [L]];

describe("blinker rules", () => {
  it.each<[BlinkerPulse[][], string | null, number]>([
    [[[S, L], [L], [L], [S, L]], "ABBA", 3],
    [CAB, "CAB", 0],
    [[[L, L, S], [S, L], [L, L, S]], "DAD", 15],
    [AB, "AB", -1], // decodes, but is not a listed word
    [[[S, S, S]], null, -1], // pulses that match no letter
  ])("%j reads as %s on frequency %i", (letters, word, frequency) => {
    expect(blinkerDecode(rules, letters)).toBe(word);
    expect(blinkerFrequencyFor(rules, letters)).toBe(frequency);
  });
});

describe("blinker light", () => {
  const state: BlinkerState = { letters: AB, tuned: 0 };

  it("measures one pass through the word", () => {
    expect(blinkerCycleMs(state)).toBe(5500);
    expect(blinkerCycleMs({ letters: [], tuned: 0 })).toBe(0);
  });

  it.each<[number, boolean]>([
    [0, true], // short pulse
    [249, true],
    [250, false], // gap between pulses
    [499, false],
    [500, true], // long pulse
    [1249, true],
    [1250, false], // gap between letters
    [2249, false],
    [2250, true], // second letter, long pulse
    [2999, true],
    [3000, false], // gap before the word repeats
    [5499, false],
    [5500, true], // second pass
    [5750, false],
    [6000, true],
    [11_000 + 2600, true],
  ])("at %i ms the light is on: %s", (elapsedMs, on) => {
    expect(blinkerLightOn(state, elapsedMs)).toBe(on);
  });

  it("stays dark for an empty word", () => {
    expect(blinkerLightOn({ letters: [], tuned: 0 }, 100)).toBe(false);
  });
});

describe("blinker module", () => {
  const ctx = ctxFor(rules, { edgework: edgework() });
  const state: BlinkerState = { letters: CAB, tuned: 1 };

  it("tunes up and down", () => {
    expect(blinker.apply(state, { type: "tune", dir: 1 }, ctx)).toEqual({ state: { letters: CAB, tuned: 2 } });
    expect(blinker.apply(state, { type: "tune", dir: -1 }, ctx)).toEqual({ state: { letters: CAB, tuned: 0 } });
  });

  it("ignores tuning past either end", () => {
    const low = { letters: CAB, tuned: 0 };
    const high = { letters: CAB, tuned: 15 };
    expect(blinker.apply(low, { type: "tune", dir: -1 }, ctx)).toEqual({ state: low });
    expect(blinker.apply(high, { type: "tune", dir: 1 }, ctx)).toEqual({ state: high });
  });

  it("solves when transmitting on the word's frequency", () => {
    const tuned = { letters: CAB, tuned: 0 };
    expect(blinker.apply(tuned, { type: "transmit" }, ctx)).toEqual({ state: tuned, solved: true });
  });

  it("strikes when transmitting on any other frequency", () => {
    expect(blinker.apply(state, { type: "transmit" }, ctx)).toEqual({ state, strike: true });
  });

  it("hints toward the frequency, then to transmit", () => {
    expect(blinker.hint(state, ctx)).toEqual({ type: "tune", dir: -1 });
    expect(blinker.hint({ letters: [[L, L, S], [S, L], [L, L, S]], tuned: 1 }, ctx)).toEqual({ type: "tune", dir: 1 });
    expect(blinker.hint({ letters: CAB, tuned: 0 }, ctx)).toEqual({ type: "transmit" });
    expect(blinker.hint({ letters: AB, tuned: 0 }, ctx)).toBeNull();
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(blinker.parseAction({ type: "tune", dir: 1 })).toEqual({ type: "tune", dir: 1 });
    expect(blinker.parseAction({ type: "tune", dir: -1, extra: true })).toEqual({ type: "tune", dir: -1 });
    expect(blinker.parseAction({ type: "transmit" })).toEqual({ type: "transmit" });
    expect(blinker.parseAction({ type: "tune", dir: 2 })).toBeNull();
    expect(blinker.parseAction({ type: "tune", dir: "1" })).toBeNull();
    expect(blinker.parseAction({ type: "tune" })).toBeNull();
    expect(blinker.parseAction({ type: "send" })).toBeNull();
    expect(blinker.parseAction(["transmit"])).toBeNull();
  });

  it("generates the same rules for the same rule seed", () => {
    const a = blinker.generateRules(createRng("rules:77").fork("blinker"));
    const b = blinker.generateRules(createRng("rules:77").fork("blinker"));
    const c = blinker.generateRules(createRng("rules:78").fork("blinker"));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("gives every letter a unique code of one to four pulses and every word its own frequency", () => {
    const generated = blinker.generateRules(createRng("rules:5").fork("blinker"));
    expect(generated.code.map((e) => e.letter).join("")).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    expect(new Set(generated.code.map((e) => e.pulses.join(","))).size).toBe(26);
    expect(generated.code.every((e) => e.pulses.length >= 1 && e.pulses.length <= 4)).toBe(true);
    expect(generated.words.map((w) => w.word)).toEqual([...BLINKER_WORDS]);
    expect(generated.words.map((w) => w.frequency).sort((x, y) => x - y)).toEqual(BLINKER_FREQUENCIES.map((_, i) => i));
  });

  it("lists sixteen distinct words of four to six letters and ascending frequencies", () => {
    expect(new Set(BLINKER_WORDS).size).toBe(16);
    expect(BLINKER_WORDS.every((w) => /^[A-Z]{4,6}$/.test(w))).toBe(true);
    expect(BLINKER_FREQUENCIES).toHaveLength(16);
    expect([...BLINKER_FREQUENCIES].sort()).toEqual([...BLINKER_FREQUENCIES]);
    expect(new Set(BLINKER_FREQUENCIES).size).toBe(16);
  });

  it("builds an instance that blinks a listed word", () => {
    const generated = blinker.generateRules(createRng("rules:5").fork("blinker"));
    const instance = blinker.generate(createRng("bomb:1"), { edgework: edgework() }, generated);
    expect(BLINKER_WORDS).toContain(blinkerDecode(generated, instance.letters));
    expect(instance.tuned).toBeGreaterThanOrEqual(0);
    expect(instance.tuned).toBeLessThanOrEqual(15);
  });

  it("plays 200 random instances to completion by following the hint", () => {
    for (const seed of ["rules:1", "rules:2", "rules:3"]) {
      const generated = blinker.generateRules(createRng(seed).fork("blinker"));
      expect(checkModuleSolvable(blinker, generated, { samples: 200, seed: "other" })).toEqual({ ok: true });
    }
  });

  it("flags a rule set whose frequencies are off the dial", () => {
    const broken: BlinkerRules = { ...rules, words: rules.words.map((w) => ({ ...w, frequency: 99 })) };
    expect(checkModuleSolvable(blinker, broken, { samples: 50 }).ok).toBe(false);
  });
});
