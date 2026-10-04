import "server-only";
import type { z } from "zod";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(status: number, error: string): Response {
  return json({ error }, status);
}

export const NO_DATABASE = () => fail(503, "This server has no database, so rooms and saved runs are off.");

/** Parses a JSON request body against a schema. Returns a Response on failure. */
export async function readBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes = 2_000_000,
): Promise<T | Response> {
  const text = await request.text();
  if (text.length > maxBytes) return fail(413, "Request body is too large.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail(400, "Request body must be JSON.");
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : fail(400, "Request body is not valid.");
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
