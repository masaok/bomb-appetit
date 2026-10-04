import { generateBomb, validateSpec } from "@bombappetit/engine";
import { describe, expect, it } from "vitest";
import { DEFAULT_FREEPLAY, freeplayFromQuery, freeplaySpec, freeplayToQuery } from "./freeplay";
import { MISSIONS, missionSpec } from "./missions";
import { ROOM_CODE_ALPHABET, roomCodeSchema, roomOpSchema } from "./rooms";

describe("freeplay settings", () => {
  it("survive a trip through the URL", () => {
    const config = {
      ...DEFAULT_FREEPLAY,
      moduleCount: 5,
      needyCount: 2,
      strikeLimit: 1,
      ruleSeed: 42,
      modulePool: ["wires" as const, "recall" as const],
    };
    const query = Object.fromEntries(new URLSearchParams(freeplayToQuery(config)));
    expect(freeplayFromQuery(query)).toEqual({ ...config, timeLimitMs: DEFAULT_FREEPLAY.timeLimitMs });
  });

  it("default to three modules and five minutes", () => {
    expect(freeplayFromQuery({})).toMatchObject({
      moduleCount: 3,
      timeLimitMs: 300_000,
      strikeLimit: 3,
      ruleSeed: 1,
    });
  });

  it.each([
    { modules: "0" },
    { modules: "abc" },
    { pool: "wires,not-a-module" },
    { pool: "pressure-vent" },
    { strikes: "9" },
    { rule: "0" },
  ])("reject %j", (query) => {
    expect(freeplayFromQuery(query)).toBeNull();
  });

  it("move to the bigger case when the modules do not fit the small one", () => {
    expect(freeplaySpec({ ...DEFAULT_FREEPLAY, moduleCount: 11, needyCount: 0 }, 1).caseSize).toBe("3x2");
    expect(freeplaySpec({ ...DEFAULT_FREEPLAY, moduleCount: 11, needyCount: 3 }, 1).caseSize).toBe("4x3");
  });
});

describe("missions", () => {
  it("are 20 in four sections of five, in order", () => {
    expect(MISSIONS).toHaveLength(20);
    expect(MISSIONS.map((m) => `${m.section}.${m.order}`)).toEqual(
      [1, 2, 3, 4].flatMap((section) => [1, 2, 3, 4, 5].map((order) => `${section}.${order}`)),
    );
  });

  it("each build a bomb with the module counts they promise", () => {
    for (const mission of MISSIONS) {
      const spec = missionSpec(mission, 123);
      expect(validateSpec(spec), mission.id).toBeNull();
      expect(generateBomb(spec).modules, mission.id).toHaveLength(mission.moduleCount + mission.needyCount);
    }
  });
});

describe("rooms", () => {
  it("use five-letter codes with no I or O", () => {
    expect(ROOM_CODE_ALPHABET).toHaveLength(24);
    expect(roomCodeSchema.safeParse("HLRNQ").success).toBe(true);
    expect(roomCodeSchema.safeParse("HIRNQ").success).toBe(false);
    expect(roomCodeSchema.safeParse("HORNQ").success).toBe(false);
    expect(roomCodeSchema.safeParse("hlrnq").success).toBe(false);
  });

  it("reject unknown operations and out-of-range status", () => {
    expect(roomOpSchema.safeParse({ op: "start" }).success).toBe(true);
    expect(roomOpSchema.safeParse({ op: "detonate" }).success).toBe(false);
    expect(
      roomOpSchema.safeParse({
        op: "status",
        status: { remainingMs: -1, strikes: 0, strikeLimit: 3, solved: 0, total: 1, needyActive: false },
      }).success,
    ).toBe(false);
  });
});
