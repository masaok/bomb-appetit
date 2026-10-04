import { getDb } from "@/db/client";
import { cloud } from "@/lib/cloud";
import { adminQuery, currentAdmin } from "@/lib/server/admin";
import { adminStore } from "@/lib/server/admin-store";
import { fail } from "@/lib/server/http";

/**
 * An admin table as a CSV download. The private package decides the columns and reads
 * the query the same way its page does, so the file matches what the admin was looking at.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/admin/export/[table]">) {
  const admin = await currentAdmin();
  const db = getDb();
  // Same answer for "not an admin" and "no such route", so the endpoint cannot be probed.
  if (!admin || !db || !cloud.exportAdminTable) return fail(404, "Not found.");

  const { table } = await ctx.params;
  const file = await cloud.exportAdminTable({
    table,
    query: adminQuery(new URL(request.url).searchParams),
    store: adminStore(db),
  });
  if (!file) return fail(404, "Not found.");

  // The byte order mark makes spreadsheet apps read the file as UTF-8.
  return new Response(`\uFEFF${file.csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file.filename.replace(/[^\w.-]/g, "_")}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
