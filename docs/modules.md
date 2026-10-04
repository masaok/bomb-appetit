# Adding a module

A module is three things: a pure state machine in the engine, a face the Defuser
touches, and a manual section the Experts read. Wires is the reference
implementation. Read it before you write a module:

- `packages/engine/src/modules/wires/index.ts`
- `packages/engine/test/modules/wires.test.ts`
- `apps/web/components/modules/wires/Face.tsx`
- `apps/web/components/modules/wires/Manual.tsx`
- `apps/web/components/modules/wires/Face.test.tsx`

## Files

For a module with id `my-module`:

| File | Holds |
| --- | --- |
| `packages/engine/src/modules/my-module/index.ts` | `ModuleDef`, its State, Action and Rules types, the rule generator |
| `packages/engine/test/modules/my-module.test.ts` | Engine tests |
| `apps/web/components/modules/my-module/Face.tsx` | Defuser view, exports `Face` |
| `apps/web/components/modules/my-module/Manual.tsx` | Expert view, exports `Manual` |
| `apps/web/components/modules/my-module/Face.test.tsx` | Face test |

Then register it in `packages/engine/src/modules/registry.ts`,
`apps/web/components/modules/faces.tsx` and `apps/web/components/modules/manuals.tsx`.

The web files import engine types from `@bombappetit/engine/modules/my-module`.
Prefix every exported name with the module name (`MyModuleState`, `MY_MODULE_WORDS`).

## Engine rules

The contract is `ModuleDef` in `packages/engine/src/types.ts`. Read its doc comments.

- The engine is pure. No `Date.now()`, `Math.random()`, DOM, React or Node imports.
  ESLint enforces this. Randomness comes from the `Rng` you are handed. Time comes
  from `ctx.elapsedMs`, `ctx.remainingMs` and `ctx.timerText`.
- State is plain JSON data and is never mutated. Return a new object.
- Model state as a discriminated union when a module has phases
  (`{ kind: "idle" } | { kind: "held"; sinceMs: number }`), not as optional fields.
- `apply` is total. Any action that passes `parseAction` is safe in any state.
  Out-of-range or meaningless input returns `{ state }` unchanged.
- `parseAction` validates untrusted JSON from a submitted run log. Check every
  field with `isRecord` and `isInt`. Return a freshly built action, not the input.
- A wrong action returns `strike: true`. The module stays unsolved unless its rules
  say it resets.
- `hint` returns the one correct action right now, or `null` when the right move
  is to wait. Derive it from the same rule lookup `apply` uses to judge.
- Rules are data. `generateRules(ruleRng)` builds them from a grammar or by
  shuffling, wrapped in `generateSolvableRules` with `checkModuleSolvable` as the
  acceptance test. The manual renders from that data and nothing else.
- For every bomb, the rules resolve to exactly one correct action at each step.

### Timed and needy modules

- `nextEventAt(state)` returns the elapsed-ms time of the next timed event, or
  `null`. `tick` runs when the clock reaches it and must move it forward or clear it.
- A needy module (`kind: "needy"`) is never solved. It sleeps, activates, and
  strikes when its own timer runs out. First activation is 20 to 45 seconds after
  arming. After each resolution it sleeps 15 to 30 seconds.
- To draw new random values after generation, store `rng.key` and a cycle counter
  in state, then use `createRng(key).fork(String(cycle))`.
- For a needy module, `hint` returns `null` while it sleeps.

## Originality

This game is inspired by a genre, not copied from another game. Do not reproduce
any existing game's manual text, rule tables, symbols, word lists or names. Every
table is generated from the rule seed. All symbols are original SVG. Labels and
word lists are our own.

## Face rules

- A face draws inside a fixed 300 x 300 px box. `ModuleFrame` supplies the dark
  panel, the status light and the scaling. Do not draw a panel or status light.
- Start the file with `"use client"`.
- Controls are real `<button>` elements, or SVG groups with `role="button"`,
  `tabIndex` and Space/Enter handling as in the Wires face. Every control has an
  `aria-label` that a test can find.
- Use `HoldButton` from `components/bomb/HoldButton.tsx` for press-and-hold.
- Never rely on color alone. Use `GAME_COLORS` from `components/modules/colors.ts`,
  which pairs each color with a letter.
- Animate from `bomb.elapsedMs` or CSS. Respect `prefers-reduced-motion` for
  anything that is decoration. Animation that carries information (a blinking
  code) stays on.
- Use `font-display` for labels and `font-mono` for readouts. Light text is
  `#fff6e9`, dark outlines are `#15101f`.

## Manual rules

- A manual section is a server component. No hooks, no `"use client"`.
- It renders from `rules` only. It never sees a bomb.
- Use the primitives in `components/manual/primitives.tsx`.
- It must read correctly in black and white. Name colors in words.
- Write for someone reading aloud under pressure. Short sentences. One
  instruction per sentence.

## Tests

- Table tests with hand-written rules and literal expected values, one row per
  rule branch.
- `apply` behavior: correct action, wrong action, ignored action.
- `parseAction` accepts good input and rejects bad input.
- `generateRules` is deterministic per seed and passes `checkModuleSolvable`.
- A face test that clicks a control and checks the dispatched action.

Do not write a test that would still pass if the code under test returned
`undefined`.

## Checks

```sh
pnpm --filter @bombappetit/engine exec vitest run test/modules/my-module.test.ts
pnpm --filter @bombappetit/engine exec tsc --noEmit
pnpm --filter @bombappetit/engine exec eslint src/modules/my-module test/modules/my-module.test.ts
pnpm --filter web exec vitest run components/modules/my-module
pnpm --filter web exec tsc --noEmit
pnpm --filter web exec eslint components/modules/my-module
```
