"use client";

import { useEffect } from "react";
import type { CloudSfx } from "@/lib/cloud-contract";
import { SFX_NAMES, type SfxManifest } from "@/lib/audio/manifest";
import { configureAudio } from "@/lib/audio/player";

/** Hands a licensed sound sprite to the audio player, if it covers every sound the game plays. */
export function AudioManifest({ sfx }: { sfx: CloudSfx }) {
  useEffect(() => {
    const complete = SFX_NAMES.every((name) => Array.isArray(sfx.sprite[name]));
    if (complete) configureAudio({ src: sfx.src, sprite: sfx.sprite as SfxManifest["sprite"] });
    else console.warn("The cloud sound sprite is missing sounds; using the default sprite.");
  }, [sfx]);
  return null;
}
