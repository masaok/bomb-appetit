import type { Heading } from "@/lib/blog/markdown";
import { TocSpy } from "./toc-spy";

/** Built from the same parsed headings that give the body its anchors, so they cannot drift. */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  return (
    <nav aria-label="Table of contents" data-toc>
      <h2 className="font-display text-xs font-semibold tracking-widest text-tomato-text uppercase">
        On this page
      </h2>
      <ol className="mt-3 space-y-1 border-l-2 border-line/20 text-sm">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="-ml-0.5 block border-l-2 border-transparent py-1 pl-3 text-muted hover:text-ink data-[active=true]:border-tomato data-[active=true]:font-bold data-[active=true]:text-ink"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
      <TocSpy ids={headings.map((h) => h.id)} />
    </nav>
  );
}
