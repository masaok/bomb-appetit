// @vitest-environment node
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { missionProgress, runs, users } from "@/db/schema";
import { addRun, addUser, emptyDb, testDb } from "@/test/db";
import { boardPage, candidate, standing, standings, topPercent } from "./leaderboard";
import { refreshProgress } from "./progress";

const BOARD = { missionId: "first-bite", epoch: 1 };
const names = async (db: Db, options?: Parameters<typeof boardPage>[2]) =>
  (await boardPage(db, BOARD, options)).rows.map((r) => r.name);

let db: Db;
beforeAll(async () => {
  db = await testDb();
});
beforeEach(() => emptyDb(db));

describe("a board", () => {
  it("lists each player once, by their best run", async () => {
    const ada = await addUser(db, "Ada");
    await addRun(db, { defuserId: ada, timeRemainingMs: 100_000 });
    const best = await addRun(db, { defuserId: ada, timeRemainingMs: 200_000 });
    await addRun(db, { defuserId: ada, timeRemainingMs: 150_000 });

    const { rows, total } = await boardPage(db, BOARD);
    expect(total).toBe(1);
    expect(rows).toMatchObject([{ rank: 1, name: "Ada", runId: best, timeRemainingMs: 200_000 }]);
  });

  it("orders by time left, then fewer strikes, then the earlier run", async () => {
    const [slow, struck, late, early] = await Promise.all(
      ["Slow", "Struck", "Late", "Early"].map((name) => addUser(db, name)),
    );
    await addRun(db, { defuserId: slow, timeRemainingMs: 90_000 });
    await addRun(db, { defuserId: struck, timeRemainingMs: 120_000, strikes: 1 });
    await addRun(db, { defuserId: early, timeRemainingMs: 120_000, createdAt: new Date("2026-02-01") });
    await addRun(db, { defuserId: late, timeRemainingMs: 120_000, createdAt: new Date("2026-02-02") });

    expect(await names(db)).toEqual(["Early", "Late", "Struck", "Slow"]);
  });

  it("leaves out runs that are not verified defusals", async () => {
    const ada = await addUser(db, "Ada");
    await addRun(db, { defuserId: ada, timeRemainingMs: 200_000, verified: false });
    await addRun(db, { defuserId: ada, timeRemainingMs: 0, result: "exploded" });
    expect(await names(db)).toEqual([]);
  });

  it("leaves out guests and runs with no player", async () => {
    await addRun(db, { defuserId: crypto.randomUUID(), defuserName: "Guest", timeRemainingMs: 200_000 });
    await addRun(db, { defuserId: null, timeRemainingMs: 200_000 });
    expect(await names(db)).toEqual([]);
  });

  it("leaves out a user who was taken off the boards, and takes them back", async () => {
    const ada = await addUser(db, "Ada", false);
    await addRun(db, { defuserId: ada, timeRemainingMs: 200_000 });
    expect(await names(db)).toEqual([]);

    await db.update(users).set({ ranked: true }).where(eq(users.id, ada));
    expect(await names(db)).toEqual(["Ada"]);
  });

  it("keeps missions and epochs apart", async () => {
    const ada = await addUser(db, "Ada");
    await addRun(db, { defuserId: ada, timeRemainingMs: 200_000, missionId: "button-up" });
    await addRun(db, { defuserId: ada, timeRemainingMs: 200_000, boardEpoch: 2 });
    expect(await names(db)).toEqual([]);
    expect((await boardPage(db, { missionId: "first-bite", epoch: 2 })).total).toBe(1);
  });

  it("pages without repeating or dropping a player", async () => {
    for (let i = 0; i < 5; i++) {
      await addRun(db, { defuserId: await addUser(db, `P${i}`), timeRemainingMs: 100_000 - i });
    }
    expect(await names(db, { pageSize: 2, page: 1 })).toEqual(["P0", "P1"]);
    expect(await names(db, { pageSize: 2, page: 3 })).toEqual(["P4"]);
    expect(await boardPage(db, BOARD, { pageSize: 2, page: 9 })).toEqual({ rows: [], total: 5 });
  });
});

describe("the team filter", () => {
  it("splits solo runs from runs with Experts, and ranks within the filter", async () => {
    const [ada, bob] = [await addUser(db, "Ada"), await addUser(db, "Bob")];
    await addRun(db, { defuserId: ada, timeRemainingMs: 100_000 });
    await addRun(db, {
      defuserId: ada,
      timeRemainingMs: 250_000,
      expertIds: [crypto.randomUUID(), crypto.randomUUID()],
      expertNames: ["Cy", "Di"],
    });
    await addRun(db, { defuserId: bob, timeRemainingMs: 200_000 });

    expect(await names(db)).toEqual(["Ada", "Bob"]);
    expect(await names(db, { team: "solo" })).toEqual(["Bob", "Ada"]);
    const team = await boardPage(db, BOARD, { team: "team" });
    expect(team.rows).toMatchObject([{ name: "Ada", rank: 1, expertNames: ["Cy", "Di"] }]);
  });
});

describe("a standing", () => {
  it("gives the rank, the board size and the percentile", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 10; i++) {
      ids.push(await addUser(db, `P${i}`));
      await addRun(db, { defuserId: ids[i], timeRemainingMs: 100_000 - i });
    }
    expect(await standing(db, BOARD, ids[0]!)).toMatchObject({ rank: 1, total: 10, topPercent: 10 });
    expect(await standing(db, BOARD, ids[9]!)).toMatchObject({ rank: 10, total: 10, topPercent: 100 });
    expect((await standings(db, ids[4]!)).get("first-bite")).toMatchObject({ rank: 5, topPercent: 50 });
  });

  it("is null for a player with no defusal, never 'Top 100%'", async () => {
    const ada = await addUser(db, "Ada");
    await addRun(db, { defuserId: ada, timeRemainingMs: 0, result: "exploded" });
    expect(await standing(db, BOARD, ada)).toBeNull();
    expect((await standings(db, ada)).size).toBe(0);
  });

  it("rounds the percentile up and keeps it between 1 and 100", () => {
    expect(topPercent(1, 1)).toBe(100);
    expect(topPercent(1, 1000)).toBe(1);
    expect(topPercent(11, 200)).toBe(6);
  });
});

describe("a candidate run", () => {
  it("predicts the rank the run gets once it is saved", async () => {
    const [ada, bob, cy] = [await addUser(db, "Ada"), await addUser(db, "Bob"), await addUser(db, "Cy")];
    await addRun(db, { defuserId: ada, timeRemainingMs: 200_000 });
    await addRun(db, { defuserId: bob, timeRemainingMs: 100_000 });
    await addRun(db, { defuserId: cy, timeRemainingMs: 50_000 });
    await addRun(db, { defuserId: cy, timeRemainingMs: 0, result: "exploded" });

    // A tie with Bob: the saved run is earlier, so the new one goes behind it.
    const run = { timeRemainingMs: 100_000, strikes: 0 };
    expect(await candidate(db, BOARD, cy, run)).toEqual({
      boardRank: 3,
      boardSize: 3,
      priorBestMs: 50_000,
      priorAttempts: 2,
    });
    await addRun(db, { defuserId: cy, ...run });
    expect((await standing(db, BOARD, cy))?.rank).toBe(3);
  });

  it("has no prior best on a first attempt", async () => {
    const ada = await addUser(db, "Ada");
    expect(await candidate(db, BOARD, ada, { timeRemainingMs: 1, strikes: 0 })).toEqual({
      boardRank: 1,
      boardSize: 1,
      priorBestMs: null,
      priorAttempts: 0,
    });
  });
});

describe("mission progress", () => {
  const best = async (playerId: string) =>
    (await db.select().from(missionProgress).where(eq(missionProgress.playerId, playerId)))[0]?.bestTimeMs;

  it("goes down when the best run is unverified, and away when none is left", async () => {
    const ada = await addUser(db, "Ada");
    const first = await addRun(db, { defuserId: ada, timeRemainingMs: 100_000 });
    const second = await addRun(db, { defuserId: ada, timeRemainingMs: 200_000 });
    await refreshProgress(db, ada, "first-bite");
    expect(await best(ada)).toBe(200_000);

    await db.update(runs).set({ verified: false }).where(eq(runs.id, second));
    await refreshProgress(db, ada, "first-bite");
    expect(await best(ada)).toBe(100_000);

    await db.delete(runs).where(eq(runs.id, first));
    await refreshProgress(db, ada, "first-bite");
    expect(await best(ada)).toBeUndefined();
  });
});
