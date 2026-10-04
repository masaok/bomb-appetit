import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { validateSpec, type BombSpec } from "@bombappetit/engine";
import { z } from "zod";
import { sign, unsign } from "./signing";

const specSchema = z.custom<BombSpec>(
  (value) => typeof value === "object" && value !== null && validateSpec(value as BombSpec) === null,
  "invalid bomb spec",
);

const ticketSchema = z.object({
  /** Redeemable once. Stored on the run row under a unique index. */
  id: z.uuid(),
  spec: specSchema,
  missionId: z.string().nullable(),
  roomCode: z.string().nullable(),
  /** True when the server picked the bomb seed, so the player could not study the bomb first. */
  serverSeed: z.boolean(),
  issuedAt: z.number(),
});

export type Ticket = z.infer<typeof ticketSchema>;

/**
 * A run ticket is the server's signed record of what it handed out: which bomb, for
 * which mission or room, and when. The run log comes back with it, so the server never
 * trusts the client about what was played or how long it could have taken.
 */
export function issueTicket(
  input: Omit<Ticket, "id" | "issuedAt"> & { id?: string; issuedAt?: number },
): string {
  return sign("run-ticket", {
    ...input,
    id: input.id ?? randomUUID(),
    issuedAt: input.issuedAt ?? Date.now(),
  });
}

export function readTicket(token: string): Ticket | null {
  const parsed = ticketSchema.safeParse(unsign("run-ticket", token));
  return parsed.success ? parsed.data : null;
}

export function randomBombSeed(): number {
  return randomInt(0, 2 ** 48 - 1);
}
