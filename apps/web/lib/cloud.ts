import impl from "@bombappetit/cloud";
import type { CloudModule } from "./cloud-contract";

/**
 * `@bombappetit/cloud` resolves to `.cloud/src/index.ts`, which scripts/sync-cloud.mjs
 * fills with the private package when it is available and with a re-export of
 * `cloud-stub.tsx` otherwise.
 * The annotation is the contract check: a private build that drifts fails typecheck here.
 */
export const cloud: CloudModule = impl;
