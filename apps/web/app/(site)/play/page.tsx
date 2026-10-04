import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/page-intro";
import { PlaySetup } from "@/components/play/PlaySetup";
import { env } from "@/lib/server/env";

export const metadata: Metadata = {
  title: "Play",
  description: "Start a bomb on this device or create an online room for your Defuser and Experts.",
};

// Reads server configuration at request time, so a deploy with a database shows rooms.
export const dynamic = "force-dynamic";

export default function PlayPage() {
  return (
    <>
      <PageIntro kicker="Play" title="Pick your kitchen">
        One of you gets the bomb. Everyone else gets the manual.
      </PageIntro>
      <PlaySetup roomsAvailable={env.databaseUrl !== null} />
    </>
  );
}
