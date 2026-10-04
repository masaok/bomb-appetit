import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { authSecret, env } from "@/lib/server/env";

declare module "next-auth" {
  interface Session {
    /** Our own `users.id`, set when the sign-in could be stored. */
    userId?: string;
  }
}

/** GitHub sign-in is optional. It needs both the OAuth credentials and a database to keep users in. */
export const signInAvailable = () => env.githubAuth !== null && env.databaseUrl !== null;

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  secret: authSecret(),
  trustHost: true,
  session: { strategy: "jwt" },
  providers: env.githubAuth ? [GitHub(env.githubAuth)] : [],
  callbacks: {
    async jwt({ token, account, profile }) {
      const db = getDb();
      if (account?.provider === "github" && profile && db) {
        const githubId = String(profile.id);
        const name = String(profile.name ?? profile.login ?? "Player").slice(0, 40);
        const seen = {
          name,
          login: typeof profile.login === "string" ? profile.login : null,
          email: typeof profile.email === "string" ? profile.email.toLowerCase() : null,
          avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
          lastLoginAt: new Date(),
        };
        const [user] = await db
          .insert(users)
          .values({ githubId, ...seen })
          .onConflictDoUpdate({ target: users.githubId, set: seen })
          .returning({ id: users.id });
        token.uid = user?.id;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === "string") session.userId = token.uid;
      return session;
    },
  },
}));

export async function isAdmin(userId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  // Read the role on every check so a demotion takes effect at once, not when a token expires.
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return user?.role === "admin";
}
