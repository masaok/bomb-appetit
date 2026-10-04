import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { authSecret } from "./env";

function mac(purpose: string, body: string): string {
  return createHmac("sha256", authSecret()).update(`${purpose}.${body}`).digest("base64url");
}

/**
 * Packs a JSON value into a tamper-evident string. `purpose` separates token kinds,
 * so a guest cookie can never be replayed as a run ticket.
 */
export function sign(purpose: string, payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(purpose, body)}`;
}

/** Returns the payload if the signature is valid, else null. The caller still parses the shape. */
export function unsign(purpose: string, token: string): unknown {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;
  const expected = Buffer.from(mac(purpose, body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
