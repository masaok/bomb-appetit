import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { cloud } from "@/lib/cloud";
import { MARKETING_ROUTES, type MarketingRoute } from "@/lib/cloud-contract";

/**
 * A route file in `app/(marketing)/` mounts its page from the cloud package with this.
 * The copy lives there; a build without the page answers with a 404.
 */
export function marketingRoute(route: MarketingRoute): { metadata: Metadata; Page: () => ReactNode } {
  const page = cloud.marketing[route];
  return {
    metadata: page?.metadata ?? {},
    Page: function MarketingPage() {
      if (!page) notFound();
      return <page.Page />;
    },
  };
}

/** False for a marketing route this build has no page for. Other paths are always served. */
export function routeServed(href: string): boolean {
  const route = MARKETING_ROUTES.find((r) => r === href);
  return route === undefined || cloud.marketing[route] !== null;
}
