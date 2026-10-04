import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { cloud } from "@/lib/cloud";
import { currentAdmin } from "@/lib/server/admin";
import { adminStore } from "@/lib/server/admin-store";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Mount point for the admin pages, which ship in the private cloud package.
 * A visitor who is not an admin gets the same 404 as any unknown page.
 */
export default async function AdminPage({ params }: PageProps<"/admin/[[...path]]">) {
  const admin = await currentAdmin();
  const db = getDb();
  if (!admin || !db) notFound();
  const { path } = await params;
  return <cloud.AdminApp path={path ?? []} store={adminStore(db)} adminName={admin.name} />;
}
