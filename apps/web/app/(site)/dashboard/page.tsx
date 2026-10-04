import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signInAvailable } from "@/auth";
import { PageIntro } from "@/components/marketing/page-intro";
import { getDb } from "@/db/client";
import { missionProgress, users } from "@/db/schema";
import { signOutToHome } from "@/lib/actions/auth";
import { MISSIONS } from "@/lib/missions";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Bomb Appetit account.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/play", label: "Play", body: "Start a bomb or open a room." },
  { href: "/missions", label: "Missions", body: "Pick up the tasting menu where you left it." },
  { href: "/leaderboard", label: "Leaderboard", body: "See where your best runs landed." },
];

export default async function DashboardPage() {
  const db = getDb();
  const session = signInAvailable() ? await auth() : null;
  // The page is the security boundary: without a stored user there is nothing to show.
  if (!db || !session?.userId) redirect("/");

  const [[user], [progress]] = await Promise.all([
    db.select().from(users).where(eq(users.id, session.userId)),
    db.select({ done: count() }).from(missionProgress).where(eq(missionProgress.playerId, session.userId)),
  ]);
  if (!user) redirect("/");

  const joined = new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(user.createdAt);

  return (
    <>
      <PageIntro kicker="Dashboard" title={`Welcome, ${user.name}`}>
        You are signed in with GitHub. Your name goes on the leaderboard and your mission progress follows you
        between devices.
      </PageIntro>
      <div className="mx-auto grid max-w-5xl gap-8 px-6 pt-6 pb-20">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="sticker rounded-3xl bg-card p-5">
            <dt className="text-sm font-bold text-muted">Missions defused</dt>
            <dd className="font-display text-3xl font-semibold">
              {progress?.done ?? 0} of {MISSIONS.length}
            </dd>
          </div>
          <div className="sticker rounded-3xl bg-card p-5">
            <dt className="text-sm font-bold text-muted">Member since</dt>
            <dd className="font-display text-3xl font-semibold">{joined}</dd>
          </div>
          <div className="sticker rounded-3xl bg-card p-5">
            <dt className="text-sm font-bold text-muted">Role</dt>
            <dd className="font-display text-3xl font-semibold capitalize">{user.role}</dd>
          </div>
        </dl>
        <ul className="grid gap-4 sm:grid-cols-3">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="sticker sticker-press block h-full rounded-3xl bg-card p-5">
                <span className="font-display text-2xl font-semibold">{link.label}</span>
                <span className="mt-1 block text-muted">{link.body}</span>
              </Link>
            </li>
          ))}
        </ul>
        <form action={signOutToHome} className="flex flex-wrap items-center gap-4">
          <button type="submit" className="sticker sticker-press rounded-full bg-card px-5 py-1.5 font-bold">
            Sign out
          </button>
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="sticker sticker-press rounded-full bg-sun px-5 py-1.5 font-bold text-night"
            >
              Admin dashboard
            </Link>
          )}
        </form>
      </div>
    </>
  );
}
