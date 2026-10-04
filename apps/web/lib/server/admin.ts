import "server-only";
import { auth, isAdmin, signInAvailable } from "@/auth";

/** The signed-in admin, or null. Every admin page and admin API route calls this itself. */
export async function currentAdmin(): Promise<{ id: string; name: string } | null> {
  if (!signInAvailable()) return null;
  const session = await auth();
  if (!session?.userId || !(await isAdmin(session.userId))) return null;
  return { id: session.userId, name: session.user?.name ?? "Admin" };
}
