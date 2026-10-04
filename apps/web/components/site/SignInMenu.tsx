"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signInWithGitHub } from "@/lib/actions/auth";

/** Every way to sign in. GitHub is the only one for now; add a row here for the next. */
const PROVIDERS = [{ id: "github", label: "Continue with GitHub", action: signInWithGitHub }] as const;

const button = "sticker sticker-press rounded-full bg-card px-5 py-1.5 font-display text-lg font-semibold";

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-5 shrink-0 fill-current">
      <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
    </svg>
  );
}

/**
 * The header's account control. The header sits on statically rendered pages, so the
 * session is read in the browser instead of on the server. The menu is a `<details>`
 * element, which opens and submits without JavaScript.
 */
export function SignInMenu() {
  const [signedIn, setSignedIn] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((session: { userId?: string } | null) => {
        if (live && session?.userId) setSignedIn(true);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const close = (event: Event) => {
      const details = menu.current;
      if (!details?.open) return;
      const escape = event instanceof KeyboardEvent && event.key === "Escape";
      const outside = event.type === "pointerdown" && !details.contains(event.target as Node);
      if (escape || outside) details.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  if (signedIn) {
    return (
      <Link href="/dashboard" className={button}>
        Dashboard
      </Link>
    );
  }

  return (
    <details ref={menu} className="group relative">
      <summary
        className={`${button} flex cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden`}
      >
        Sign in
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className="size-3 fill-none stroke-current stroke-2 transition-transform group-open:rotate-180"
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="sticker absolute right-0 z-20 mt-3 w-64 rounded-2xl bg-card p-2">
        <p className="px-3 pt-1 pb-2 text-sm text-muted">Choose how to sign in</p>
        <ul>
          {PROVIDERS.map((provider) => (
            <li key={provider.id}>
              <form action={provider.action}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-bold hover:bg-sun hover:text-night"
                >
                  <GitHubMark />
                  {provider.label}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
