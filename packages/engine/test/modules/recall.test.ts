import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  recall,
  recallPositionToPress,
  type RecallPress,
  type RecallRules,
  type RecallStage,
  type RecallState,
} from "../../src/modules/recall";
import { ctxFor } from "../helpers";

const rules: RecallRules = {
  stages: [
    [
      { kind: "position", position: 1 },
      { kind: "label", label: 4 },
      { kind: "position", position: 3 },
      { kind: "label", label: 1 },
    ],
    [
      { kind: "samePosition", stage: 0 },
      { kind: "sameLabel", stage: 0 },
      { kind: "position", position: 0 },
      { kind: "label", label: 2 },
    ],
    [
      { kind: "sameLabel", stage: 1 },
      { kind: "samePosition", stage: 1 },
      { kind: "sameLabel", stage: 0 },
      { kind: "samePosition", stage: 0 },
    ],
    [
      { kind: "position", position: 2 },
      { kind: "label", label: 3 },
      { kind: "samePosition", stage: 2 },
      { kind: "sameLabel", stage: 2 },
    ],
    [
      { kind: "sameLabel", stage: 3 },
      { kind: "samePosition", stage: 0 },
      { kind: "label", label: 1 },
      { kind: "position", position: 0 },
    ],
  ],
};

const stages: RecallStage[] = [
  { display: 2, labels: [3, 1, 4, 2] }, // label 4: position 2
  { display: 2, labels: [4, 2, 1, 3] }, // same label as stage 1 (4): position 0
  { display: 4, labels: [1, 2, 3, 4] }, // same position as stage 1 (2), label 3
  { display: 4, labels: [2, 3, 4, 1] }, // same label as stage 3 (3): position 1
  { display: 1, labels: [1, 4, 2, 3] }, // same label as stage 4 (3): position 3
];

function at(history: RecallPress[], overrides: Partial<RecallStage> = {}): RecallState {
  const patched = stages.map((s, i) => (i === history.length ? { ...s, ...overrides } : s));
  return { key: "k", resets: 0, stages: patched, history };
}

describe("recall rules", () => {
  const first = [{ position: 2, label: 4 }];
  const second = [...first, { position: 0, label: 4 }];

  it.each<[string, RecallState, number]>([
    ["position", at([], { display: 1 }), 1],
    ["label", at([]), 2],
    ["same position as an earlier stage", at(first, { display: 1 }), 2],
    ["same label as an earlier stage", at(first), 0],
    ["same label as stage two", at(second, { display: 1 }), 3],
    ["same position as stage two", at(second, { display: 2 }), 0],
    ["same label as stage one", at(second, { display: 3 }), 3],
    ["same position as stage one", at(second), 2],
    ["a finished module", at([...second, ...second, first[0]!]), -1],
  ])("%s", (_name, state, expected) => {
    expect(recallPositionToPress(rules, state)).toBe(expected);
  });
});

describe("recall rules that look back too far", () => {
  it("resolve to no position", () => {
    const broken: RecallRules = { stages: [[1, 2, 3, 4].map(() => ({ kind: "sameLabel", stage: 0 }) as const)] };
    expect(recallPositionToPress(broken, at([]))).toBe(-1);
  });
});

describe("recall module", () => {
  const ctx = ctxFor(rules);
  const start = at([]);

  it("records the position and label of each correct press and solves on the fifth", () => {
    let state = start;
    const expected: RecallPress[] = [
      { position: 2, label: 4 },
      { position: 0, label: 4 },
      { position: 2, label: 3 },
      { position: 1, label: 3 },
      { position: 3, label: 3 },
    ];
    expected.forEach((press, i) => {
      const result = recall.apply(state, { type: "press", position: press.position }, ctx);
      expect(result.state.history).toEqual(expected.slice(0, i + 1));
      expect(result.strike).toBeUndefined();
      expect(result.solved).toBe(i === 4 ? true : undefined);
      state = result.state;
    });
  });

  it("strikes on a wrong press and resets to stage one with new content", () => {
    const mid = at([{ position: 2, label: 4 }]);
    const result = recall.apply(mid, { type: "press", position: 3 }, ctx);
    expect(result.strike).toBe(true);
    expect(result.solved).toBeUndefined();
    expect(result.state.history).toEqual([]);
    expect(result.state.resets).toBe(1);
    expect(result.state.key).toBe("k");
    expect(result.state.stages).toHaveLength(5);
    expect(result.state.stages).not.toEqual(mid.stages);
    for (const stage of result.state.stages) {
      expect([...stage.labels].sort()).toEqual([1, 2, 3, 4]);
      expect([1, 2, 3, 4]).toContain(stage.display);
    }
    // the replacement is a pure function of key and reset count
    expect(recall.apply(mid, { type: "press", position: 3 }, ctx)).toEqual(result);
    const again = recall.apply({ ...mid, resets: 1 }, { type: "press", position: 3 }, ctx);
    expect(again.state.stages).not.toEqual(result.state.stages);
  });

  it("ignores presses once every stage is done", () => {
    const done = at(Array.from({ length: 5 }, () => ({ position: 0, label: 1 })));
    expect(recall.apply(done, { type: "press", position: 0 }, ctx)).toEqual({ state: done });
    expect(recall.hint(done, ctx)).toBeNull();
  });

  it("hints the position the rules resolve to", () => {
    expect(recall.hint(start, ctx)).toEqual({ type: "press", position: 2 });
    expect(recall.hint(at([{ position: 2, label: 4 }]), ctx)).toEqual({ type: "press", position: 0 });
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(recall.parseAction({ type: "press", position: 3, extra: 1 })).toEqual({ type: "press", position: 3 });
    expect(recall.parseAction({ type: "press", position: 4 })).toBeNull();
    expect(recall.parseAction({ type: "press", position: "1" })).toBeNull();
    expect(recall.parseAction({ type: "spin", position: 1 })).toBeNull();
    expect(recall.parseAction([])).toBeNull();
  });

  it("generates the same rules for the same rule seed, with valid back references", () => {
    const a = recall.generateRules(createRng("rules:77").fork("recall"));
    const b = recall.generateRules(createRng("rules:77").fork("recall"));
    expect(a).toEqual(b);
    expect(a.stages.map((row) => row.length)).toEqual([4, 4, 4, 4, 4]);
    a.stages.forEach((row, stage) => {
      for (const instruction of row) {
        if (instruction.kind === "samePosition" || instruction.kind === "sameLabel") {
          expect(instruction.stage).toBeLessThan(stage);
        }
      }
    });
    expect(recall.generateRules(createRng("rules:78").fork("recall"))).not.toEqual(a);
  });

  it("generates the same instance for the same rng", () => {
    const a = recall.generate(createRng("bomb:1"), { edgework: ctx.edgework }, rules);
    expect(a).toEqual(recall.generate(createRng("bomb:1"), { edgework: ctx.edgework }, rules));
    expect(a.key).toBe("bomb:1");
    expect(a.stages).toHaveLength(5);
    expect(a.history).toEqual([]);
  });

  it("plays 200 random instances to completion by following hints", () => {
    const generated = recall.generateRules(createRng("rules:5").fork("recall"));
    expect(checkModuleSolvable(recall, generated, { samples: 200, seed: "play" })).toEqual({ ok: true });
  });

  it("flags a rule set that looks back at a stage not yet played", () => {
    const broken: RecallRules = {
      stages: rules.stages.map(() => [1, 2, 3, 4].map(() => ({ kind: "samePosition", stage: 4 }) as const)),
    };
    expect(checkModuleSolvable(recall, broken, { samples: 50 }).ok).toBe(false);
  });
});
