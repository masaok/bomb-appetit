import Link from "next/link";
import { Logo } from "@/components/logo";
import { NAV_LINKS } from "./links";

/**
 * Shared site header. On small screens the nav drops to its own wrapping row
 * under the logo, so it works without JavaScript.
 */
export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
      <Logo />
      <nav
        aria-label="Main"
        className="order-last flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 font-bold lg:order-none lg:w-auto lg:gap-x-6"
      >
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-tomato">
            {link.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/play"
        className="sticker sticker-press rounded-full bg-tomato px-6 py-1.5 font-display text-lg font-semibold text-white"
      >
        Play
      </Link>
    </header>
  );
}
