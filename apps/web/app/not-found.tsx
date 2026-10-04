import Link from "next/link";
import { Mascot } from "@/components/mascot";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Mascot decorative className="h-40 w-auto" />
      <h1 className="mt-6 font-display text-4xl font-bold">Nothing on this plate</h1>
      <p className="mt-2 text-lg text-muted">That page does not exist, or the room has expired.</p>
      <Link
        href="/"
        className="sticker sticker-press mt-6 rounded-full bg-sun px-7 py-3 font-display text-lg font-semibold text-night"
      >
        Back to the start
      </Link>
    </main>
  );
}
