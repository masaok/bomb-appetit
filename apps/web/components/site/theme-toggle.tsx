"use client";

/** Where the visitor's choice is kept. Absent means light, whatever the OS prefers. */
export const THEME_KEY = "theme";

/**
 * Runs in <head> before first paint so a saved dark choice never flashes light.
 * Storage can throw in private windows; light is the fallback.
 */
export const THEME_SCRIPT = `try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {
    // The theme still switches for this page view.
  }
}

/** The icon swaps with CSS, so the server render never disagrees with the client. */
export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="sticker sticker-press grid size-9 place-items-center rounded-full bg-card text-ink"
    >
      <svg
        viewBox="0 0 20 20"
        className="size-4 dark:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M16.5 11.5A6.5 6.5 0 0 1 8.5 3.5a6.5 6.5 0 1 0 8 8z" />
      </svg>
      <svg
        viewBox="0 0 20 20"
        className="hidden size-4 dark:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="10" cy="10" r="3.5" />
        <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.3 4.3l1.1 1.1M14.6 14.6l1.1 1.1M4.3 15.7l1.1-1.1M14.6 5.4l1.1-1.1" />
      </svg>
    </button>
  );
}
