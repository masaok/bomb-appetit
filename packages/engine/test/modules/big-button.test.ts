import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng, type Edgework } from "../../src";
import {
  bigButton,
  bigButtonMove,
  BIG_BUTTON_COLORS,
  type BigButtonColor,
  type BigButtonLabel,
  type BigButtonMove,
  type BigButtonRules,
  type BigButtonState,
} from "../../src/modules/big-button";
import { ctxFor, edgework } from "../helpers";

const rules: BigButtonRules = {
  rules: [
    { when: [{ kind: "color", color: "red" }, { kind: "label", label: "BOOP" }], then: "hold" },
    { when: [{ kind: "batteries", cmp: "moreThan", n: 2 }], then: "tap" },
    { when: [{ kind: "litIndicator", label: "YUM" }], then: "hold" },
    { when: [{ kind: "label", label: "HUSH" }], then: "tap" },
    { when: [{ kind: "color", color: "blue" }, { kind: "batteries", cmp: "fewerThan", n: 2 }], then: "tap" },
  ],
  otherwise: "hold",
  stripDigits: { red: 4, blue: 1, yellow: 7, white: 0, green: 5 },
};

describe("big button rules", () => {
  it.each<[BigButtonColor, BigButtonLabel, Partial<Edgework>, BigButtonMove]>([
    ["red", "BOOP", { batteries: ["pack", "pack"] }, "hold"], // red and BOOP beats the battery line
    ["red", "NOPE", { batteries: ["pack", "cell"] }, "tap"], // more than 2 batteries
    ["red", "HUSH", { batteries: ["pack"], indicators: [{ label: "YUM", lit: true }] }, "hold"], // lit YUM
    ["yellow", "HUSH", { indicators: [{ label: "YUM", lit: false }] }, "tap"], // unlit YUM is skipped, HUSH
    ["blue", "NOPE", { batteries: ["cell"] }, "tap"], // blue and fewer than 2 batteries
    ["blue", "NOPE", { batteries: ["pack"] }, "hold"], // otherwise
  ])("%s %s on %j says %s", (color, label, overrides, expected) => {
    expect(bigButtonMove(rules, { color, label }, edgework(overrides))).toBe(expected);
  });
});

describe("big button module", () => {
  const idle: BigButtonState = { color: "red", label: "NOPE", strip: "blue", press: { kind: "idle" } };
  const held: BigButtonState = { ...idle, press: { kind: "held", sinceMs: 1000 } };
  const tapBomb = edgework({ batteries: ["pack", "cell"] });
  const holdBomb = edgework();

  it("records when the press started", () => {
    expect(bigButton.apply(idle, { type: "press" }, ctxFor(rules, { elapsedMs: 1000 }))).toEqual({ state: held });
  });

  it("solves on a quick release when the rules say tap", () => {
    const ctx = ctxFor(rules, { edgework: tapBomb, elapsedMs: 1499 });
    expect(bigButton.apply(held, { type: "release" }, ctx)).toEqual({ state: idle, solved: true });
  });

  it("strikes and returns to idle on a hold when the rules say tap", () => {
    const ctx = ctxFor(rules, { edgework: tapBomb, elapsedMs: 1500, remainingMs: 241_000 });
    expect(bigButton.apply(held, { type: "release" }, ctx)).toEqual({ state: idle, strike: true });
  });

  it("solves a hold released while the display contains the strip digit", () => {
    const ctx = ctxFor(rules, { edgework: holdBomb, elapsedMs: 3000, remainingMs: 241_000 }); // 4:01
    expect(ctx.timerText).toBe("4:01");
    expect(bigButton.apply(held, { type: "release" }, ctx)).toEqual({ state: idle, solved: true });
  });

  it("strikes a hold released at the wrong moment", () => {
    const ctx = ctxFor(rules, { edgework: holdBomb, elapsedMs: 3000, remainingMs: 242_000 }); // 4:02
    expect(bigButton.apply(held, { type: "release" }, ctx)).toEqual({ state: idle, strike: true });
  });

  it("strikes a tap when the rules say hold, even with the digit showing", () => {
    const ctx = ctxFor(rules, { edgework: holdBomb, elapsedMs: 1200, remainingMs: 241_000 });
    expect(bigButton.apply(held, { type: "release" }, ctx)).toEqual({ state: idle, strike: true });
  });

  it("ignores a release while idle and a press while held", () => {
    const ctx = ctxFor(rules, { elapsedMs: 2000 });
    expect(bigButton.apply(idle, { type: "release" }, ctx)).toEqual({ state: idle });
    expect(bigButton.apply(held, { type: "press" }, ctx)).toEqual({ state: held });
  });

  it("hints press, then the release the rules call for", () => {
    expect(bigButton.hint(idle, ctxFor(rules))).toEqual({ type: "press" });
    expect(bigButton.hint(held, ctxFor(rules, { edgework: tapBomb, elapsedMs: 1050 }))).toEqual({ type: "release" });

    const hold = (elapsedMs: number, remainingMs: number) =>
      bigButton.hint(held, ctxFor(rules, { edgework: holdBomb, elapsedMs, remainingMs }));
    expect(hold(3000, 242_000)).toBeNull(); // 4:02 has no 1
    expect(hold(1400, 241_000)).toBeNull(); // digit showing, but still a tap
    expect(hold(1500, 241_000)).toEqual({ type: "release" });
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(bigButton.parseAction({ type: "press", extra: 1 })).toEqual({ type: "press" });
    expect(bigButton.parseAction({ type: "release" })).toEqual({ type: "release" });
    expect(bigButton.parseAction({ type: "hold" })).toBeNull();
    expect(bigButton.parseAction("press")).toBeNull();
    expect(bigButton.parseAction(null)).toBeNull();
  });

  it("generates the same rules for the same rule seed, and solvable ones", () => {
    const a = bigButton.generateRules(createRng("rules:77").fork("big-button"));
    const b = bigButton.generateRules(createRng("rules:77").fork("big-button"));
    expect(a).toEqual(b);
    expect(a.rules.length).toBeGreaterThanOrEqual(4);
    const digits = BIG_BUTTON_COLORS.map((color) => a.stripDigits[color]);
    expect(new Set(digits).size).toBe(5);
    expect(digits.every((d) => Number.isInteger(d) && d >= 0 && d <= 9)).toBe(true);
  });

  it("plays 200 random instances to completion by following hint", () => {
    for (const seed of ["rules:1", "rules:2", "rules:3"]) {
      const generated = bigButton.generateRules(createRng(seed).fork("big-button"));
      expect(checkModuleSolvable(bigButton, generated, { samples: 200, seed: "other" })).toEqual({ ok: true });
    }
  });
});
