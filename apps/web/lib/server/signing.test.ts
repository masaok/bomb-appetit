// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sign, unsign } from "./signing";
import { issueTicket, readTicket } from "./tickets";

const spec = {
  bombSeed: 7,
  ruleSeed: 1,
  timeLimitMs: 300_000,
  strikeLimit: 3,
  caseSize: "3x2" as const,
  moduleCount: 1,
  modulePool: ["wires" as const],
  needyCount: 0,
  needyPool: [],
};

describe("signing", () => {
  it("returns the payload for an untouched token", () => {
    expect(unsign("guest", sign("guest", { id: "a", name: "Dee" }))).toEqual({ id: "a", name: "Dee" });
  });

  it("rejects a token whose payload was edited", () => {
    const [, signature] = sign("guest", { id: "a", role: "player" }).split(".");
    const forged = Buffer.from(JSON.stringify({ id: "a", role: "admin" })).toString("base64url");
    expect(unsign("guest", `${forged}.${signature}`)).toBeNull();
  });

  it("rejects a token signed for a different purpose", () => {
    expect(unsign("run-ticket", sign("guest", { id: "a" }))).toBeNull();
  });

  it("rejects garbage", () => {
    expect(unsign("guest", "")).toBeNull();
    expect(unsign("guest", "a.b.c")).toBeNull();
  });
});

describe("run tickets", () => {
  it("round-trips what the server issued", () => {
    const token = issueTicket({
      spec,
      missionId: "first-bite",
      roomCode: null,
      serverSeed: true,
      issuedAt: 1_000,
    });
    expect(readTicket(token)).toMatchObject({
      spec,
      missionId: "first-bite",
      roomCode: null,
      serverSeed: true,
      issuedAt: 1_000,
    });
  });

  it("rejects a signed ticket whose bomb spec is not buildable", () => {
    const token = sign("run-ticket", {
      id: "0b6b4a52-8f2f-4d58-9a55-2f5e6f0d9a11",
      spec: { ...spec, moduleCount: 99 },
      missionId: null,
      roomCode: null,
      serverSeed: true,
      issuedAt: 1,
    });
    expect(readTicket(token)).toBeNull();
  });

  it("rejects a guest cookie presented as a ticket", () => {
    expect(readTicket(sign("guest", { id: "a", name: "Dee" }))).toBeNull();
  });
});
