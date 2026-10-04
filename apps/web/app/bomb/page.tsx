import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SoloGame } from "@/components/play/SoloGame";
import { freeplayFromQuery } from "@/lib/freeplay";
import { missionById } from "@/lib/missions";

export const metadata: Metadata = { title: "Bomb", robots: { index: false } };

export default async function BombPage({ searchParams }: PageProps<"/bomb">) {
  const query = await searchParams;

  if (typeof query.mission === "string") {
    const mission = missionById(query.mission);
    if (!mission) notFound();
    return (
      <SoloGame
        start={{ kind: "mission", missionId: mission.id }}
        title={mission.title}
        backHref="/missions"
      />
    );
  }

  const config = freeplayFromQuery(query);
  if (!config) notFound();
  const seed =
    typeof query.seed === "string" && /^\d{1,15}$/.test(query.seed) ? Number(query.seed) : undefined;
  return <SoloGame start={{ kind: "freeplay", config, bombSeed: seed }} title="Freeplay" backHref="/play" />;
}
