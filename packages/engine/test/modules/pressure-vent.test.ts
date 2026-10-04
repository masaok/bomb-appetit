import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  PRESSURE_VENT_PROMPTS,
  pressureVent,
  pressureVentAnswer,
  type PressureVentRules,
  type PressureVentState,
} from "../../src/modules/pressure-vent";
import { ctxFor, edgework } from "../helpers";

const rules: PressureVentRules = {
  prompts: [
    { text: "Salt the fuse?", yes: true },
    { text: "Whisk the wick?", yes: false },
  ],
};
const at = (elapsedMs: number) => ctxFor(rules, { elapsedMs });

const asleep: PressureVentState = { kind: "asleep", key: "vent", cycle: 0, wakeAtMs: 30_000 };
const active: PressureVentState = {
  kind: "active",
  key: "vent",
  cycle: 0,
  prompt: "Salt the fuse?",
  deadlineMs: 70_000,
};

function expectAsleep(state: PressureVentState): Extract<PressureVentState, { kind: "asleep" }> {
  if (state.kind !== "asleep") throw new Error(`expected asleep, got ${state.kind}`);
  return state;
}

describe("pressure vent rules", () => {
  it.each<[string, boolean | null]>([
    ["Salt the fuse?", true],
    ["Whisk the wick?", false],
    ["Not in the manual?", null],
  ])("%s answers %s", (prompt, expected) => {
    expect(pressureVentAnswer(rules, prompt)).toBe(expected);
  });
});

describe("pressure vent module", () => {
  it("first wakes 20 to 45 seconds after arming", () => {
    for (let i = 0; i < 100; i++) {
      const state = expectAsleep(
        pressureVent.generate(createRng(`bomb${i}`), { edgework: edgework() }, rules),
      );
      expect(state.wakeAtMs).toBeGreaterThanOrEqual(20_000);
      expect(state.wakeAtMs).toBeLessThanOrEqual(45_000);
      expect(state).toMatchObject({ key: `bomb${i}`, cycle: 0 });
    }
  });

  it("wakes with a prompt from the manual and a 40 second deadline", () => {
    expect(pressureVent.nextEventAt?.(asleep)).toBe(30_000);
    const woken = pressureVent.tick?.(asleep, at(30_000));
    expect(woken?.strike).toBeUndefined();
    expect(woken?.state).toMatchObject({ kind: "active", key: "vent", cycle: 0, deadlineMs: 70_000 });
    const state = woken?.state as Extract<PressureVentState, { kind: "active" }>;
    expect(["Salt the fuse?", "Whisk the wick?"]).toContain(state.prompt);
    expect(pressureVent.nextEventAt?.(state)).toBe(70_000);
  });

  it("goes back to sleep for 15 to 30 seconds on the correct answer", () => {
    const result = pressureVent.apply(active, { type: "answer", yes: true }, at(41_000));
    expect(result.strike).toBeUndefined();
    const next = expectAsleep(result.state);
    expect(next.cycle).toBe(1);
    expect(next.wakeAtMs).toBeGreaterThanOrEqual(56_000);
    expect(next.wakeAtMs).toBeLessThanOrEqual(71_000);
  });

  it("strikes and sleeps on the wrong answer", () => {
    const result = pressureVent.apply(active, { type: "answer", yes: false }, at(41_000));
    expect(result.strike).toBe(true);
    expect(expectAsleep(result.state).cycle).toBe(1);

    const no: PressureVentState = { ...active, prompt: "Whisk the wick?" };
    expect(pressureVent.apply(no, { type: "answer", yes: true }, at(41_000)).strike).toBe(true);
    expect(pressureVent.apply(no, { type: "answer", yes: false }, at(41_000)).strike).toBeUndefined();
  });

  it("strikes at exactly 40 seconds after waking when unanswered, then sleeps", () => {
    expect(pressureVent.nextEventAt?.(active)).toBe(70_000);
    const result = pressureVent.tick?.(active, at(70_000));
    expect(result?.strike).toBe(true);
    const next = expectAsleep(result?.state as PressureVentState);
    expect(next.cycle).toBe(1);
    expect(next.wakeAtMs).toBeGreaterThanOrEqual(85_000);
    expect(next.wakeAtMs).toBeLessThanOrEqual(100_000);
  });

  it("ignores answers while asleep", () => {
    expect(pressureVent.apply(asleep, { type: "answer", yes: true }, at(10_000))).toEqual({ state: asleep });
    expect(pressureVent.apply(asleep, { type: "answer", yes: false }, at(10_000))).toEqual({ state: asleep });
  });

  it("hints the manual's answer while active and nothing while asleep", () => {
    expect(pressureVent.hint(active, at(41_000))).toEqual({ type: "answer", yes: true });
    expect(pressureVent.hint({ ...active, prompt: "Whisk the wick?" }, at(41_000))).toEqual({
      type: "answer",
      yes: false,
    });
    expect(pressureVent.hint(asleep, at(10_000))).toBeNull();
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(pressureVent.parseAction({ type: "answer", yes: false })).toEqual({ type: "answer", yes: false });
    expect(pressureVent.parseAction({ type: "answer", yes: 1 })).toBeNull();
    expect(pressureVent.parseAction({ type: "answer" })).toBeNull();
    expect(pressureVent.parseAction({ type: "vent", yes: true })).toBeNull();
    expect(pressureVent.parseAction([])).toBeNull();
  });
});

describe("pressure vent generated rules", () => {
  const generated = pressureVent.generateRules(createRng("rules:77").fork("pressure-vent"));

  it("is deterministic per rule seed", () => {
    expect(pressureVent.generateRules(createRng("rules:77").fork("pressure-vent"))).toEqual(generated);
  });

  it("lists six different prompts with a mix of answers", () => {
    expect(generated.prompts).toHaveLength(6);
    expect(new Set(generated.prompts.map((p) => p.text)).size).toBe(6);
    for (const prompt of generated.prompts) expect(PRESSURE_VENT_PROMPTS).toContain(prompt.text);
    const yes = generated.prompts.filter((p) => p.yes).length;
    expect(yes).toBeGreaterThanOrEqual(2);
    expect(yes).toBeLessThanOrEqual(4);
  });

  it("survives 90 seconds by following hints", () => {
    expect(checkModuleSolvable(pressureVent, generated, { samples: 200, seed: "other" })).toEqual({
      ok: true,
    });
  });

  it("flags a manual that is missing a prompt the module can show", () => {
    const state: PressureVentState = { ...active, prompt: "Not in the manual?" };
    const stuck = { ...pressureVent, generate: () => state };
    expect(checkModuleSolvable(stuck, generated, { samples: 5 }).ok).toBe(false);
  });
});
