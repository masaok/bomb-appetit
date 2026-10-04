"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="font-display text-4xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-lg text-muted">
        The page hit an error. If a bomb was armed, reloading resumes it where you left off.
        {error.digest && <span className="mt-2 block font-mono text-sm">Reference {error.digest}</span>}
      </p>
      <button
        type="button"
        onClick={reset}
        className="sticker sticker-press mt-6 rounded-full bg-sun px-7 py-3 font-display text-lg font-semibold text-night"
      >
        Try again
      </button>
    </main>
  );
}
