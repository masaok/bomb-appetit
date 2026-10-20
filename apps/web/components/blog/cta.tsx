import Link from "next/link";
import { cta } from "@/lib/blog/config";

/** The blog's one call to action: under the table of contents and at the end of every post. */
export function CallToActionBox({ id }: { id: string }) {
  return (
    <aside aria-labelledby={id} className="sticker rounded-2xl bg-card p-5">
      <h2 id={id} className="font-display text-xl font-semibold">
        {cta.heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{cta.body}</p>
      <Link
        href={cta.href}
        className="sticker sticker-press mt-4 inline-block rounded-full bg-tomato px-5 py-1.5 font-display text-lg font-semibold text-white"
      >
        {cta.label}
      </Link>
    </aside>
  );
}
