import type { Instrumentation } from "next";

/**
 * Server-side error tracking. Every uncaught request error lands in the platform's
 * logs as one structured line, where Vercel's log drains and alerts can pick it up.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  console.error(
    JSON.stringify({
      level: "error",
      source: "onRequestError",
      // First line only: driver errors append the full query and its parameters.
      message: (error instanceof Error ? error.message : String(error)).split("\n")[0],
      digest: (error as { digest?: string }).digest,
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
    }),
  );
};
