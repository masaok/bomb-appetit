import Link from "next/link";
import { Mascot } from "./mascot";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-display text-2xl font-semibold tracking-tight ${className}`}
    >
      <Mascot decorative className="h-10 w-auto" />
      <span>
        Bomb <span className="text-tomato-text">Appetit</span>
      </span>
    </Link>
  );
}
