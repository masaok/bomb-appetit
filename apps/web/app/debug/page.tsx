import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DebugBomb } from "@/components/debug/DebugBomb";
import { freeplayFromQuery, freeplaySpec } from "@/lib/freeplay";

export const metadata: Metadata = { title: "Debug", robots: { index: false } };

/** `/debug?seed=7&modules=11&needy=3`: a bomb with its answers showing. Never served in production. */
export default async function DebugPage({ searchParams }: PageProps<"/debug">) {
  if (process.env.NODE_ENV === "production") notFound();
  const query = await searchParams;
  const config = freeplayFromQuery(query);
  if (!config) notFound();
  const seed = typeof query.seed === "string" && /^\d{1,15}$/.test(query.seed) ? Number(query.seed) : 1;
  return <DebugBomb spec={freeplaySpec(config, seed)} />;
}
