import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { missionProgress } from "@/db/schema";
import { formatDuration } from "@/components/hud/format";
import { PageIntro } from "@/components/marketing/page-intro";
import { MISSIONS, moduleNames, SECTION_TITLES } from "@/lib/missions";
import { currentPlayer } from "@/lib/server/player";

export const metadata: Metadata = {
  title: "Missions",
  description: "Twenty bombs in four courses, from a single set of wires to a full case with one strike.",
};

export const dynamic = "force-dynamic";

async function bestTimes(): Promise<Map<string, number>> {
  const db = getDb();
  const player = db ? await currentPlayer() : null;
  if (!db || !player) return new Map();
  const rows = await db.select().from(missionProgress).where(eq(missionProgress.playerId, player.id));
  return new Map(rows.map((r) => [r.missionId, r.bestTimeMs]));
}

export default async function MissionsPage() {
  const best = await bestTimes();
  const sections = [1, 2, 3, 4].map((section) => ({
    section,
    missions: MISSIONS.filter((m) => m.section === section),
  }));

  return (
    <>
      <PageIntro kicker="Missions" title="The tasting menu">
        Twenty bombs in four courses. Each one deals a fresh bomb, so no two tables get the same plate.
      </PageIntro>
      <div className="mx-auto grid max-w-5xl gap-10 px-6 pb-20">
        {sections.map(({ section, missions }) => (
          <section key={section} aria-labelledby={`section-${section}`}>
            <h2 id={`section-${section}`} className="font-display text-3xl font-semibold">
              {section}. {SECTION_TITLES[section]}
            </h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2">
              {missions.map((mission) => {
                const done = best.get(mission.id);
                return (
                  <li key={mission.id} className="sticker flex flex-col rounded-3xl bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-2xl font-semibold">{mission.title}</h3>
                      {done !== undefined && (
                        <span className="sticker shrink-0 rounded-full bg-mint px-3 py-0.5 text-sm font-extrabold text-night">
                          Defused · {formatDuration(done)} left
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-muted">{mission.blurb}</p>
                    <p className="mt-3 text-sm font-bold">
                      {mission.moduleCount} {mission.moduleCount === 1 ? "module" : "modules"}
                      {mission.needyCount > 0 && ` + ${mission.needyCount} needy`} ·{" "}
                      {formatDuration(mission.timeLimitMs)} · {mission.strikeLimit}{" "}
                      {mission.strikeLimit === 1 ? "strike" : "strikes"} · manual {mission.ruleSeed}
                    </p>
                    <p className="mt-1 text-sm text-muted">From: {moduleNames(mission.modulePool)}</p>
                    <div className="mt-4 flex flex-wrap gap-3 pt-1">
                      <Link
                        href={`/bomb?mission=${mission.id}`}
                        className="sticker sticker-press rounded-full bg-tomato px-5 py-2 font-display font-semibold text-white"
                      >
                        Play
                      </Link>
                      <Link
                        href={`/leaderboard?mission=${mission.id}`}
                        className="sticker sticker-press rounded-full bg-page px-5 py-2 font-display font-semibold"
                      >
                        Leaderboard
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
