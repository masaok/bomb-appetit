import Link from "next/link";
import { Logo } from "@/components/logo";
import { routeServed } from "@/lib/marketing";
import { GITHUB_URL } from "./links";

const FOOTER_LINKS = [
  { href: "/press", label: "Press kit" },
  { href: "/changelog", label: "Changelog" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-line px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 lg:flex-row">
        <Logo className="text-xl" />
        <p className="text-center text-sm text-muted">© 2026 Bomb Appétit. No real bombs were harmed.</p>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold"
        >
          {FOOTER_LINKS.filter((link) => routeServed(link.href)).map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-tomato-text">
              {link.label}
            </Link>
          ))}
          <a href={GITHUB_URL} className="hover:text-tomato-text">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
