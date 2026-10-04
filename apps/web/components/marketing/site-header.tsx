import Link from "next/link";
import { signInAvailable } from "@/auth";
import { Logo } from "@/components/logo";
import { SignInMenu } from "@/components/site/SignInMenu";
import { NAV_LINKS } from "./links";

/**
 * Shared site header. On small screens the nav drops to its own wrapping row
 * under the logo, so it works without JavaScript. Sign-in is offered only when the
 * deploy has GitHub credentials and a database.
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
          <Link key={link.href} href={link.href} className="hover:text-tomato-text">
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {signInAvailable() && <SignInMenu />}
        <Link
          href="/play"
          className="sticker sticker-press rounded-full bg-tomato px-6 py-1.5 font-display text-lg font-semibold text-white"
        >
          Play
        </Link>
      </div>
    </header>
  );
}
