import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  dischargeLever,
  dischargeLeverLevel,
  dischargeLeverPercent,
  type DischargeLeverState,
} from "../../src/modules/discharge-lever";
import { ctxFor, edgework } from "../helpers";

const at = (elapsedMs: number) => ctxFor({}, { elapsedMs });

const idle: DischargeLeverState = { kind: "idle", startAtMs: 30_000 };
const filling: DischargeLeverState = { kind: "running", level: 0, atMs: 30_000, held: false };
const draining: DischargeLeverState = { kind: "running", level: 30_000, atMs: 60_000, held: true };

describe("discharge lever level", () => {
  it.each<[string, DischargeLeverState, number, number, number]>([
    ["idle reads empty", idle, 99_000, 0, 0],
    ["just started", filling, 30_000, 0, 0],
    ["a time before the reference", filling, 10_000, 0, 0],
    ["one second in", filling, 31_000, 1_000, 2],
    ["nine seconds in", filling, 39_000, 9_000, 20],
    ["one ms short of full", filling, 74_999, 44_999, 99],
    ["full at 45 seconds", filling, 75_000, 45_000, 100],
    ["never above full", filling, 90_000, 45_000, 100],
    ["held drains five times faster", draining, 61_000, 25_000, 55],
    ["held for six seconds is empty", draining, 66_000, 0, 0],
    ["never below empty", draining, 80_000, 0, 0],
  ])("%s", (_name, state, elapsedMs, level, percent) => {
    expect(dischargeLeverLevel(state, elapsedMs)).toBe(level);
    expect(dischargeLeverPercent(state, elapsedMs)).toBe(percent);
  });
});

describe("discharge lever module", () => {
  it("first starts 20 to 45 seconds after arming", () => {
    for (let i = 0; i < 100; i++) {
      const state = dischargeLever.generate(createRng(`bomb${i}`), { edgework: edgework() }, {});
      if (state.kind !== "idle") throw new Error("expected idle");
      expect(state.startAtMs).toBeGreaterThanOrEqual(20_000);
      expect(state.startAtMs).toBeLessThanOrEqual(45_000);
    }
  });

  it("starts filling from empty at its start time", () => {
    expect(dischargeLever.nextEventAt?.(idle)).toBe(30_000);
    expect(dischargeLever.tick?.(idle, at(30_000))).toEqual({ state: filling });
  });

  it("strikes exactly 45 seconds after starting, resets to empty and keeps running", () => {
    expect(dischargeLever.nextEventAt?.(filling)).toBe(75_000);
    expect(dischargeLever.tick?.(filling, at(75_000))).toEqual({
      state: { kind: "running", level: 0, atMs: 75_000, held: false },
      strike: true,
    });
    expect(dischargeLever.nextEventAt?.({ kind: "running", level: 0, atMs: 75_000, held: false })).toBe(
      120_000,
    );
  });

  it("has no timed event while the lever is held", () => {
    expect(dischargeLever.nextEventAt?.(draining)).toBeNull();
  });

  it("press freezes the level reached so far and starts draining", () => {
    expect(dischargeLever.apply(filling, { type: "press" }, at(60_000))).toEqual({ state: draining });
  });

  it("release keeps what is left and schedules the next overflow from there", () => {
    const released = dischargeLever.apply(draining, { type: "release" }, at(62_000));
    expect(released).toEqual({ state: { kind: "running", level: 20_000, atMs: 62_000, held: false } });
    expect(dischargeLever.nextEventAt?.(released.state)).toBe(87_000);
  });

  it("ignores a second press, a release with nothing held, and anything before it starts", () => {
    expect(dischargeLever.apply(draining, { type: "press" }, at(61_000))).toEqual({ state: draining });
    expect(dischargeLever.apply(filling, { type: "release" }, at(40_000))).toEqual({ state: filling });
    expect(dischargeLever.apply(idle, { type: "press" }, at(5_000))).toEqual({ state: idle });
    expect(dischargeLever.apply(idle, { type: "release" }, at(5_000))).toEqual({ state: idle });
  });

  it.each<[string, DischargeLeverState, number, unknown]>([
    ["idle", idle, 10_000, null],
    ["at exactly 60%", filling, 57_000, null],
    ["just above 60%", filling, 57_001, { type: "press" }],
    ["still draining", draining, 65_999, null],
    ["drained to empty", draining, 66_000, { type: "release" }],
  ])("hint when %s", (_name, state, elapsedMs, expected) => {
    expect(dischargeLever.hint(state, at(elapsedMs))).toEqual(expected);
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(dischargeLever.parseAction({ type: "press" })).toEqual({ type: "press" });
    expect(dischargeLever.parseAction({ type: "release", extra: 1 })).toEqual({ type: "release" });
    expect(dischargeLever.parseAction({ type: "hold" })).toBeNull();
    expect(dischargeLever.parseAction("press")).toBeNull();
  });

  it("has an empty, stable rule set and survives 90 seconds by following hints", () => {
    const rules = dischargeLever.generateRules(createRng("rules:77").fork("discharge-lever"));
    expect(rules).toEqual({});
    expect(checkModuleSolvable(dischargeLever, rules, { samples: 200, seed: "other" })).toEqual({ ok: true });
  });

  it("fails the survival check when nobody pulls the lever", () => {
    const lazy = { ...dischargeLever, hint: () => null };
    expect(checkModuleSolvable(lazy, {}, { samples: 5 }).ok).toBe(false);
  });
});
