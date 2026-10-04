// @vitest-environment node
import { autoPlay, generateBomb } from "@bombappetit/engine";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db/client";
import { missionProgress, roomPlayers, rooms, runs } from "@/db/schema";
import type { PlausibilityInput, PlausibilityVerdict } from "@/lib/cloud-contract";
import { missionById, missionSpec } from "@/lib/missions";
import { addUser, emptyDb, testDb } from "@/test/db";
import { boardPage } from "./leaderboard";
import type { Player } from "./player";
import { submitRun } from "./runs";
import { issueTicket } from "./tickets";

const mocks = vi.hoisted(() => ({
  db: null as unknown,
  verdict: { plausible: true } as PlausibilityVerdict,
  inputs: [] as PlausibilityInput[],
  expireBoard: vi.fn(),
}));
vi.mock("@/db/client", () => ({ getDb: () => mocks.db }));
vi.mock("@/lib/cloud", () => ({
  cloud: {
    verifyRunPlausibility: (input: PlausibilityInput) => {
      mocks.inputs.push(input);
      return mocks.verdict;
    },
  },
}));
vi.mock("./board-cache", () => ({ expireBoard: mocks.expireBoard }));
vi.mock("@/lib/realtime/server", () => ({ realtime: { publish: async () => {} } }));

// Three modules, so the gap between actions changes how much time is left.
const MISSION = missionById("strange-symbols")!;
const BOARD = { missionId: MISSION.id, epoch: MISSION.boardEpoch };
const spec = missionSpec(MISSION, 0);

/** A ticket for the mission and a log that defuses it, with `gapMs` between the actions. */
function play(gapMs: number, room?: { code: string; roundId: string }) {
  const ticket = issueTicket({
    spec,
    missionId: MISSION.id,
    roomCode: room?.code ?? null,
    serverSeed: false,
    id: room?.roundId,
  });
  return { ticket, log: autoPlay(generateBomb(spec), { actionGapMs: gapMs }).log };
}

let db: Db;
beforeAll(async () => {
  db = await testDb();
  mocks.db = db;
});
beforeEach(async () => {
  await emptyDb(db);
  mocks.verdict = { plausible: true };
  mocks.inputs.length = 0;
  mocks.expireBoard.mockClear();
});

const user = async (name: string): Promise<Player> => ({ id: await addUser(db, name), name, kind: "user" });

describe("submitRun", () => {
  it("ranks a signed-in player's defusal and tells them where it landed", async () => {
    const ada = await user("Ada");
    const { ticket, log } = play(1_000);
    const result = await submitRun(ticket, log, ada);

    expect(result).toMatchObject({
      ok: true,
      verified: true,
      standing: { rank: 1, total: 1, topPercent: 100 },
    });
    expect((await boardPage(db, BOARD)).rows).toMatchObject([{ name: "Ada", rank: 1 }]);
    expect(mocks.expireBoard).toHaveBeenCalledWith(MISSION.id);
    expect(await db.select().from(missionProgress)).toHaveLength(1);
  });

  it("saves a guest's defusal off the board and says signing in would rank it", async () => {
    const guest: Player = { id: crypto.randomUUID(), name: "Guest", kind: "guest" };
    const { ticket, log } = play(1_000);
    const result = await submitRun(ticket, log, guest);

    expect(result).toMatchObject({ ok: true, verified: true, standing: "guest" });
    expect((await boardPage(db, BOARD)).total).toBe(0);
    expect(mocks.inputs[0]!.board).toBeNull();
    // A guest's own progress is still kept, as before.
    expect(await db.select().from(missionProgress)).toHaveLength(1);
  });

  it("tells the plausibility checks where the run would land", async () => {
    const [ada, bob] = [await user("Ada"), await user("Bob")];
    await submitRun(...(Object.values(play(2_000)) as [string, unknown]), ada);
    await submitRun(...(Object.values(play(3_000)) as [string, unknown]), bob);
    await submitRun(...(Object.values(play(1_000)) as [string, unknown]), bob);

    expect(mocks.inputs.map((i) => i.board)).toMatchObject([
      { rank: 1, size: 1, priorBestMs: null, priorAttempts: 0 },
      { rank: 2, size: 2, priorBestMs: null, priorAttempts: 0 },
      { rank: 1, size: 2, priorAttempts: 1 },
    ]);
    expect(mocks.inputs[2]!.board!.priorBestMs).toBeGreaterThan(0);
    expect(mocks.inputs[0]!.teamSize).toBe(1);
  });

  it("keeps a run that needs review on the board and stores the reasons", async () => {
    mocks.verdict = { plausible: true, review: ["Looks fast"] };
    const { ticket, log } = play(1_000);
    const result = await submitRun(ticket, log, await user("Ada"));

    expect(result).toMatchObject({ ok: true, verified: true, standing: { rank: 1 } });
    expect(await db.select({ review: runs.review, flags: runs.flags }).from(runs)).toEqual([
      { review: ["Looks fast"], flags: [] },
    ]);
  });

  it("keeps an implausible run off the board", async () => {
    mocks.verdict = { plausible: false, reasons: ["Too fast"] };
    const { ticket, log } = play(1_000);
    const result = await submitRun(ticket, log, await user("Ada"));

    expect(result).toMatchObject({ ok: true, verified: false, standing: null });
    expect((await boardPage(db, BOARD)).total).toBe(0);
    expect(mocks.expireBoard).not.toHaveBeenCalled();
  });

  it("saves the Experts' names, which outlive the room", async () => {
    const ada = await user("Ada");
    const [room] = await db
      .insert(rooms)
      .values({
        code: "ABCDE",
        hostId: ada.id,
        status: "armed",
        missionId: MISSION.id,
        bombSeed: 0,
        expiresAt: new Date(Date.now() + 60_000),
      })
      .returning();
    await db.insert(roomPlayers).values([
      { roomId: room!.id, playerId: ada.id, role: "defuser", displayName: "Ada" },
      { roomId: room!.id, playerId: crypto.randomUUID(), role: "expert", displayName: "Cy" },
      { roomId: room!.id, playerId: crypto.randomUUID(), role: "expert", displayName: "Di" },
    ]);

    const { ticket, log } = play(1_000, { code: "ABCDE", roundId: room!.roundId });
    await submitRun(ticket, log, ada);
    expect(mocks.inputs[0]!.teamSize).toBe(3);

    await db.delete(rooms).where(eq(rooms.id, room!.id));
    const [row] = (await boardPage(db, BOARD, { team: "team" })).rows;
    expect(row!.expertNames.sort()).toEqual(["Cy", "Di"]);
    expect((await boardPage(db, BOARD, { team: "solo" })).total).toBe(0);
  });
});
