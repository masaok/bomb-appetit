import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { auth, signInAvailable } from "@/auth";
import { getDb } from "@/db/client";
import { guests } from "@/db/schema";
import { env } from "./env";
import { sign, unsign } from "./signing";

export interface Player {
  id: string;
  name: string;
  kind: "user" | "guest";
}

const GUEST_COOKIE = "ba_guest";
const guestSchema = z.object({ id: z.uuid(), name: z.string().min(1).max(24) });

export const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  // Names are shown to other players, so keep them to plain printable characters.
  .regex(/^[\p{L}\p{N} _.'-]+$/u);

/** The signed-in user if there is one, else the guest behind the cookie, else null. */
export async function currentPlayer(): Promise<Player | null> {
  if (signInAvailable()) {
    const session = await auth();
    if (session?.userId) return { id: session.userId, name: session.user?.name ?? "Player", kind: "user" };
  }
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  const guest = token ? guestSchema.safeParse(unsign("guest", token)) : null;
  return guest?.success ? { ...guest.data, kind: "guest" } : null;
}

/** Returns the current player, creating a guest identity under `name` when there is none. */
export async function ensurePlayer(name: string): Promise<Player> {
  const existing = await currentPlayer();
  if (existing?.kind === "user") return existing;

  const guest = { id: existing?.id ?? randomUUID(), name };
  await getDb()
    ?.insert(guests)
    .values({ id: guest.id, displayName: name })
    .onConflictDoUpdate({ target: guests.id, set: { displayName: name } });
  (await cookies()).set(GUEST_COOKIE, sign("guest", guest), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return { ...guest, kind: "guest" };
}
