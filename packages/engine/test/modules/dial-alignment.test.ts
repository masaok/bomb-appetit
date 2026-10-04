import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  DIAL_ALIGNMENT_DIRECTIONS,
  dialAlignment,
  dialAlignmentDirection,
  dialAlignmentTurn,
  type DialAlignmentDirection,
  type DialAlignmentRules,
  type DialAlignmentState,
} from "../../src/modules/dial-alignment";
import { ctxFor, edgework } from "../helpers";

const leds = (text: string) => [...text].map((ch) => ch === "#");

const TOP_ROW = leds("######......");
const CORNERS = leds("#....##....#");

const rules: DialAlignmentRules = {
  patterns: [
    { leds: TOP_ROW, direction: "down" },
    { leds: CORNERS, direction: "left" },
  ],
};
const at = (elapsedMs: number) => ctxFor(rules, { elapsedMs });

const asleep: DialAlignmentState = { kind: "asleep", dial: "right", key: "dial", cycle: 0, wakeAtMs: 30_000 };
const active: DialAlignmentState = {
  kind: "active",
  dial: "right",
  key: "dial",
  cycle: 0,
  leds: TOP_ROW,
  deadlineMs: 70_000,
};

describe("dial alignment rules", () => {
  it.each<[string, DialAlignmentDirection | null]>([
    ["######......", "down"],
    ["#....##....#", "left"],
    ["............", null],
    ["######", null],
  ])("%s points %s", (pattern, expected) => {
    expect(dialAlignmentDirection(rules, leds(pattern))).toBe(expected);
  });

  it.each<[DialAlignmentDirection, DialAlignmentDirection]>([
    ["up", "right"],
    ["right", "down"],
    ["down", "left"],
    ["left", "up"],
  ])("turning from %s goes clockwise to %s", (from, to) => {
    expect(dialAlignmentTurn(from)).toBe(to);
  });
});

describe("dial alignment module", () => {
  it("first wakes 20 to 45 seconds after arming", () => {
    for (let i = 0; i < 100; i++) {
      const state = dialAlignment.generate(createRng(`bomb${i}`), { edgework: edgework() }, rules);
      if (state.kind !== "asleep") throw new Error("expected asleep");
      expect(state.wakeAtMs).toBeGreaterThanOrEqual(20_000);
      expect(state.wakeAtMs).toBeLessThanOrEqual(45_000);
      expect(DIAL_ALIGNMENT_DIRECTIONS).toContain(state.dial);
    }
  });

  it("wakes showing a pattern from the manual, with a 40 second window and the dial untouched", () => {
    expect(dialAlignment.nextEventAt?.(asleep)).toBe(30_000);
    const woken = dialAlignment.tick?.(asleep, at(30_000));
    expect(woken?.strike).toBeUndefined();
    expect(woken?.state).toMatchObject({ kind: "active", dial: "right", cycle: 0, deadlineMs: 70_000 });
    const state = woken?.state as Extract<DialAlignmentState, { kind: "active" }>;
    expect([TOP_ROW, CORNERS]).toContainEqual(state.leds);
  });

  it("turns the dial one step clockwise while active, with no strike", () => {
    expect(dialAlignment.apply(active, { type: "turn" }, at(40_000))).toEqual({
      state: { ...active, dial: "down" },
    });
  });

  it("ignores the dial while asleep", () => {
    expect(dialAlignment.apply(asleep, { type: "turn" }, at(10_000))).toEqual({ state: asleep });
  });

  it("strikes at exactly 40 seconds when the dial points the wrong way, then sleeps", () => {
    expect(dialAlignment.nextEventAt?.(active)).toBe(70_000);
    const result = dialAlignment.tick?.(active, at(70_000));
    expect(result?.strike).toBe(true);
    const next = result?.state as DialAlignmentState;
    if (next.kind !== "asleep") throw new Error("expected asleep");
    expect(next).toMatchObject({ dial: "right", cycle: 1 });
    expect(next.wakeAtMs).toBeGreaterThanOrEqual(85_000);
    expect(next.wakeAtMs).toBeLessThanOrEqual(100_000);
  });

  it("does not strike when the dial points the right way, and still sleeps", () => {
    const result = dialAlignment.tick?.({ ...active, dial: "down" }, at(70_000));
    expect(result?.strike).toBeUndefined();
    expect(result?.state).toMatchObject({ kind: "asleep", dial: "down", cycle: 1 });
  });

  it("hints a turn only while active and misaligned", () => {
    expect(dialAlignment.hint(active, at(40_000))).toEqual({ type: "turn" });
    expect(dialAlignment.hint({ ...active, dial: "down" }, at(40_000))).toBeNull();
    expect(dialAlignment.hint({ ...active, leds: CORNERS, dial: "down" }, at(40_000))).toEqual({
      type: "turn",
    });
    expect(dialAlignment.hint(asleep, at(10_000))).toBeNull();
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(dialAlignment.parseAction({ type: "turn" })).toEqual({ type: "turn" });
    expect(dialAlignment.parseAction({ type: "spin" })).toBeNull();
    expect(dialAlignment.parseAction("turn")).toBeNull();
    expect(dialAlignment.parseAction(null)).toBeNull();
  });
});

describe("dial alignment generated rules", () => {
  const generated = dialAlignment.generateRules(createRng("rules:77").fork("dial-alignment"));

  it("is deterministic per rule seed", () => {
    expect(dialAlignment.generateRules(createRng("rules:77").fork("dial-alignment"))).toEqual(generated);
  });

  it("has eight distinct twelve-LED patterns, with every direction used", () => {
    expect(generated.patterns).toHaveLength(8);
    for (const pattern of generated.patterns) expect(pattern.leds).toHaveLength(12);
    expect(new Set(generated.patterns.map((p) => JSON.stringify(p.leds))).size).toBe(8);
    expect(new Set(generated.patterns.map((p) => p.direction))).toEqual(new Set(DIAL_ALIGNMENT_DIRECTIONS));
  });

  it("survives 90 seconds by following hints", () => {
    expect(checkModuleSolvable(dialAlignment, generated, { samples: 200, seed: "other" })).toEqual({
      ok: true,
    });
  });

  it("fails the survival check when the dial is left alone", () => {
    const lazy = { ...dialAlignment, hint: () => null };
    expect(checkModuleSolvable(lazy, generated, { samples: 50 }).ok).toBe(false);
  });
});
