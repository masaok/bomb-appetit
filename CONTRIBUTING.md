# Contributing

## Setup

```sh
pnpm install
pnpm dev
```

A fresh clone needs no secrets. See the README for what a database adds.

## Before you open a pull request

```sh
pnpm check
pnpm build
```

A pre-commit hook formats the files you staged with Prettier. It does nothing else, so
it stays fast. A pre-push hook runs `pnpm run build`, so a push that would not build
never leaves your machine. Lint, types, tests and the build also run in CI. Do not skip the hook and do
not weaken a check to make it pass.

## Rules for code

- Use pnpm.
- `packages/engine` stays pure: no React, Next, DOM, Node imports, `Date.now()` or
  `Math.random()`. ESLint enforces this.
- A module is three files plus tests, registered in three registries. Follow
  `docs/modules.md`.
- Do not copy text, tables, symbols, word lists or audio from any other game. Rules come
  from the rule generators.
- Anti-cheat logic, licensed assets and secrets do not belong in this repository. Code
  against `apps/web/lib/cloud-contract.ts`.
- A change to a rule generator or to a module's logic changes old runs. Run
  `pnpm rules:freeze` and bump `ENGINE_VERSION` in `packages/engine/src/replay.ts`.

## Sign-off

Sign every commit with `git commit -s`. The sign-off line certifies the
[Developer Certificate of Origin](https://developercertificate.org/): you wrote the
change or have the right to submit it under the project's licenses.
