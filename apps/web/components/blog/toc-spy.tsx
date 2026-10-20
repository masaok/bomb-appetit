"use client";

import { useEffect } from "react";

// Marks the table-of-contents entry for the section in view. The entries are
// plain links, so the table works without this script.
export function TocSpy({ ids }: { ids: string[] }) {
  useEffect(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-toc] a[href^='#']")];
    const headings = ids.map((id) => document.getElementById(id)).filter((h): h is HTMLElement => h !== null);
    if (!headings.length) return;

    const mark = () => {
      const offset = 120;
      let current = headings[0]!.id;
      for (const h of headings) if (h.getBoundingClientRect().top - offset <= 0) current = h.id;
      for (const link of links) link.dataset.active = String(link.hash === `#${current}`);
    };
    mark();
    window.addEventListener("scroll", mark, { passive: true });
    return () => window.removeEventListener("scroll", mark);
  }, [ids]);
  return null;
}
