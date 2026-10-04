import { z } from "zod";
import { fail, json, readBody } from "@/lib/server/http";
import { currentPlayer } from "@/lib/server/player";
import { rateLimited } from "@/lib/server/rate-limit";
import { submitRun } from "@/lib/server/runs";

// The log's inner shape is checked by the engine's replay, action by action.
const submitSchema = z.object({ ticket: z.string().max(8_000), log: z.unknown() });

export async function POST(request: Request) {
  const limited = await rateLimited(request, "runs:submit", 20);
  if (limited) return limited;
  const body = await readBody(request, submitSchema);
  if (body instanceof Response) return body;

  const result = await submitRun(body.ticket, body.log, await currentPlayer());
  if (!result.ok) return fail(result.status, result.error);
  return json({ summary: result.summary, verified: result.verified, runId: result.runId });
}
