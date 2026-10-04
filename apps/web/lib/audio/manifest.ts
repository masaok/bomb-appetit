import spriteJson from "./sprite.json";

export const SFX_NAMES = [
  "tick",
  "tickFast",
  "solved",
  "strike",
  "needy",
  "explosion",
  "defused",
  "snip",
  "click",
  "clack",
] as const;

export type SfxName = (typeof SFX_NAMES)[number];

export interface SfxManifest {
  src: string[];
  sprite: Record<SfxName, [number, number]>;
}

function readSprite(raw: Record<string, unknown>): Record<SfxName, [number, number]> {
  const entries = SFX_NAMES.map((name): [SfxName, [number, number]] => {
    const entry = raw[name];
    if (!Array.isArray(entry) || entry.length !== 2) {
      throw new Error(`sprite.json is missing sound "${name}"; run \`pnpm sfx:build\` in apps/web`);
    }
    const [offset, duration]: unknown[] = entry;
    if (typeof offset !== "number" || typeof duration !== "number" || !(offset >= 0) || !(duration > 0)) {
      throw new Error(`sprite.json has an invalid [offsetMs, durationMs] for "${name}"`);
    }
    return [name, [offset, duration]];
  });
  return Object.fromEntries(entries) as Record<SfxName, [number, number]>;
}

export const DEFAULT_SFX: SfxManifest = {
  src: ["/audio/sfx.wav"],
  sprite: readSprite(spriteJson),
};
