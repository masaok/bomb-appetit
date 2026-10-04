"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export interface ManualEntry {
  id: string;
  title: string;
}

/**
 * The manual's sidebar: a filterable index, a seed switcher and a print button.
 * Shortcuts: `/` focuses the filter, `j` and `k` jump to the next and previous section.
 */
export function ManualTools({ entries, ruleSeed }: { entries: ManualEntry[]; ruleSeed: number }) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [seed, setSeed] = useState(String(ruleSeed));
  const input = useRef<HTMLInputElement>(null);
  const shown = entries.filter((e) => e.title.toLowerCase().includes(filter.trim().toLowerCase()));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "/") {
        event.preventDefault();
        input.current?.focus();
      }
      if (event.key !== "j" && event.key !== "k") return;
      const tops = entries.map((e) => document.getElementById(e.id)?.getBoundingClientRect().top ?? Infinity);
      // The current section is the last one whose top has passed the top of the viewport.
      const current = Math.max(
        0,
        tops.findLastIndex((top) => top <= 8),
      );
      const target =
        entries[Math.min(entries.length - 1, Math.max(0, current + (event.key === "j" ? 1 : -1)))];
      if (target) document.getElementById(target.id)?.scrollIntoView();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entries]);

  return (
    <div className="no-print flex flex-col gap-4">
      <label className="grid gap-1">
        <span className="text-xs font-bold tracking-widest text-muted uppercase">Find a module</span>
        <input
          ref={input}
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && shown[0]) {
              document.getElementById(shown[0].id)?.scrollIntoView();
              e.currentTarget.blur();
            }
          }}
          placeholder="Type, then Enter"
          className="sticker rounded-xl bg-card px-3 py-2"
          aria-keyshortcuts="/"
        />
      </label>
      <nav aria-label="Manual sections">
        <ol className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col">
          {shown.map((entry) => (
            <li key={entry.id}>
              <a href={`#${entry.id}`} className="font-bold hover:text-tomato-text">
                {entry.title}
              </a>
            </li>
          ))}
          {shown.length === 0 && <li className="text-muted">No section matches.</li>}
        </ol>
      </nav>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Math.floor(Number(seed));
          if (n >= 1 && n <= 999_999) router.push(`/manual/${n}`);
        }}
      >
        <label className="grid gap-1">
          <span className="text-xs font-bold tracking-widest text-muted uppercase">Rule seed</span>
          <input
            type="number"
            min={1}
            max={999999}
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="sticker w-28 rounded-xl bg-card px-3 py-2 font-mono font-bold"
          />
        </label>
        <button
          type="submit"
          className="sticker sticker-press rounded-full bg-sun px-4 py-2 font-bold text-night"
        >
          Open
        </button>
      </form>
      <button
        type="button"
        onClick={() => window.print()}
        className="sticker sticker-press self-start rounded-full bg-card px-4 py-2 font-bold"
      >
        Print or save as PDF
      </button>
      <p className="text-sm text-muted">
        Keys: <kbd>/</kbd> find, <kbd>j</kbd> next, <kbd>k</kbd> previous.
      </p>
    </div>
  );
}
