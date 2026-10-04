import "server-only";
import { auth, isAdmin, signInAvailable } from "@/auth";

/** The signed-in admin, or null. Every admin page and admin API route calls this itself. */
export async function currentAdmin(): Promise<{ id: string; name: string } | null> {
  if (!signInAvailable()) return null;
  const session = await auth();
  if (!session?.userId || !(await isAdmin(session.userId))) return null;
  return { id: session.userId, name: session.user?.name ?? "Admin" };
}

/**
 * The query string as the admin pages read it: one short value per key. The admin
 * tables keep their search, filters and sort here, and the CSV export reads the same.
 */
export function adminQuery(
  entries: Iterable<[string, string | string[] | undefined]>,
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of entries) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first && !(key in query)) query[key] = first.slice(0, 100);
  }
  return query;
}
