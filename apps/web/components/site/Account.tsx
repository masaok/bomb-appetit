import { auth, signIn, signInAvailable, signOut } from "@/auth";

/**
 * Sign-in is optional: guests can play everything. A GitHub account puts your name on
 * leaderboards and keeps mission progress across devices.
 */
export async function Account() {
  if (!signInAvailable()) return null;
  const session = await auth();
  const button = "sticker sticker-press rounded-full bg-card px-4 py-1.5 text-sm font-bold";

  return session?.userId ? (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/play" });
      }}
      className="flex flex-wrap items-center justify-center gap-3"
    >
      <span className="text-sm text-muted">Signed in as {session.user?.name}</span>
      <button type="submit" className={button}>
        Sign out
      </button>
    </form>
  ) : (
    <form
      action={async () => {
        "use server";
        await signIn("github", { redirectTo: "/play" });
      }}
      className="flex flex-wrap items-center justify-center gap-3"
    >
      <span className="text-sm text-muted">Playing as a guest.</span>
      <button type="submit" className={button}>
        Sign in with GitHub
      </button>
    </form>
  );
}
