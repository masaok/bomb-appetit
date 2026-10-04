<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Engineering practices

This repo and `bomb-appetit-cloud` follow [Engineering practices that survive the stack](https://www.expeditionlabs.co/resources/engineering-practices): 31 techniques across gates, boundaries, single sources of truth, honest checks, state, adoption and trust. Read it before adding or changing a check, hook, CI job, migration or config file, and start with the P0 items. Never bypass a hook or weaken a check to get green.

## This repository

A pnpm workspace. `packages/engine` is the game as pure TypeScript. `apps/web` is the Next.js app. Read `README.md` for the architecture and `docs/modules.md` before touching a module.

- Use pnpm only.
- `packages/engine` must not import React, Next, DOM APIs or Node, and must not call `Date.now()` or `Math.random()`. `packages/engine/eslint.config.mjs` enforces it and `test/purity-lint.test.ts` proves the rule fires.
- Every module follows the pattern in `docs/modules.md` and is registered in `packages/engine/src/modules/registry.ts`, `apps/web/components/modules/faces.tsx` and `manuals.tsx`. The two web registries are mapped types, so a missing module fails typecheck.
- Never copy text, tables, symbols or audio from another game. Rules come from the rule generators.
- Anti-cheat code, licensed assets and secrets never go in this repository. Code against `apps/web/lib/cloud-contract.ts`; the stub is `apps/web/lib/cloud-stub.tsx`.
- Experts must never receive the bomb seed, module state or edgework. `viewRoom` in `apps/web/lib/server/rooms.ts` is the one place that decides what a viewer gets.
- Server-only modules import `server-only`. Do not remove it to make a client import compile.
- After changing a rule generator or module logic, run `pnpm rules:freeze` and bump `ENGINE_VERSION`.
- Run `pnpm check` and `pnpm build` before calling a task done. Run `pnpm e2e` for anything that touches the bomb screen, rooms or the manual.
