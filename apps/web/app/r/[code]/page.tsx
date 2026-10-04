import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Room } from "@/components/room/Room";
import { MISSIONS } from "@/lib/missions";
import { roomCodeSchema } from "@/lib/rooms";

export const metadata: Metadata = { title: "Room", robots: { index: false } };

export default async function RoomPage({ params }: PageProps<"/r/[code]">) {
  const code = roomCodeSchema.safeParse((await params).code.toUpperCase());
  if (!code.success) notFound();
  const missions = MISSIONS.map((m) => ({ id: m.id, label: `${m.section}.${m.order} ${m.title}` }));
  return <Room code={code.data} missions={missions} />;
}
