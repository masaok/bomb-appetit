"use server";

import { signIn, signOut } from "@/auth";

/** Starts the GitHub OAuth flow. Auth.js stores the user in `users` on the way back, then lands on the dashboard. */
export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function signOutToHome() {
  await signOut({ redirectTo: "/" });
}
