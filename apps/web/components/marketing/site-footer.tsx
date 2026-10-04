import Link from "next/link";
import { Logo } from "@/components/logo";
import { GITHUB_URL } from "./links";

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
          <Link href="/press" className="hover:text-tomato-text">
            Press kit
          </Link>
          <Link href="/changelog" className="hover:text-tomato-text">
            Changelog
          </Link>
          <a href={GITHUB_URL} className="hover:text-tomato-text">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
