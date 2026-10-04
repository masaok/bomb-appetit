import { z } from "zod";
import { freeplaySchema, freeplaySpec } from "@/lib/freeplay";
import { missionById, missionSpec } from "@/lib/missions";
import { fail, json, readBody } from "@/lib/server/http";
import { rateLimited } from "@/lib/server/rate-limit";
import { issueTicket, randomBombSeed } from "@/lib/server/tickets";

const startSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("mission"), missionId: z.string().max(64) }),
  z.object({
    kind: z.literal("freeplay"),
    config: freeplaySchema,
    /** A player-chosen seed, for replaying a known bomb. Such runs are marked as not server-seeded. */
    bombSeed: z.int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  }),
]);

export type StartRunBody = z.infer<typeof startSchema>;

/** Hands out a bomb and the signed ticket that must come back with its run log. */
export async function POST(request: Request) {
  const limited = await rateLimited(request, "runs:start", 30);
  if (limited) return limited;
  const body = await readBody(request, startSchema);
  if (body instanceof Response) return body;

  if (body.kind === "mission") {
    const mission = missionById(body.missionId);
    if (!mission) return fail(404, "Unknown mission.");
    const spec = missionSpec(mission, randomBombSeed());
    const ticket = issueTicket({
      spec,
      missionId: mission.id,
      roomCode: null,
      serverSeed: mission.fixedBombSeed === null,
    });
    return json({ spec, ticket });
  }

  const spec = freeplaySpec(body.config, body.bombSeed ?? randomBombSeed());
  const ticket = issueTicket({
    spec,
    missionId: null,
    roomCode: null,
    serverSeed: body.bombSeed === undefined,
  });
  return json({ spec, ticket });
}
