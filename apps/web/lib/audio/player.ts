import type { Howl } from "howler";
import { DEFAULT_SFX, type SfxManifest, type SfxName } from "./manifest";

export interface AudioSettings {
  muted: boolean;
  volume: number;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = Object.freeze({ muted: false, volume: 0.8 });

const STORAGE_KEY = "ba:audio";

let howl: Howl | null = null;
let loading: Promise<void> | null = null;
let settings: AudioSettings | null = null;
let unlockRegistered = false;
const listeners = new Set<() => void>();

function clampVolume(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function readStoredSettings(): AudioSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_AUDIO_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_AUDIO_SETTINGS;
    const { muted, volume } = parsed as { muted?: unknown; volume?: unknown };
    return Object.freeze({
      muted: typeof muted === "boolean" ? muted : DEFAULT_AUDIO_SETTINGS.muted,
      volume:
        typeof volume === "number" && Number.isFinite(volume)
          ? clampVolume(volume)
          : DEFAULT_AUDIO_SETTINGS.volume,
    });
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

function updateSettings(next: AudioSettings): void {
  settings = Object.freeze(next);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage can be full or blocked (private mode); the setting still applies for this session.
    }
  }
  for (const listener of listeners) listener();
}

/** Returns the same object until a setting changes, so it can back `useSyncExternalStore`. */
export function getAudioSettings(): AudioSettings {
  if (typeof window === "undefined") return DEFAULT_AUDIO_SETTINGS;
  settings ??= readStoredSettings();
  return settings;
}

export function subscribeAudioSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let configured: SfxManifest = DEFAULT_SFX;

/**
 * Chooses the sound sprite before audio loads. The root layout calls this with the
 * private package's licensed sprite when there is one; otherwise the CC0 sprite plays.
 */
export function configureAudio(manifest: SfxManifest): void {
  configured = manifest;
}

/** The first manifest wins; later calls reuse the existing Howl. */
export function initAudio(manifest: SfxManifest = configured): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  loading ??= import("howler")
    .then(({ Howl }) => {
      const current = getAudioSettings();
      howl = new Howl({
        src: manifest.src,
        sprite: manifest.sprite,
        volume: current.volume,
        mute: current.muted,
      });
    })
    .catch((error: unknown) => {
      loading = null;
      console.warn("Audio failed to load", error);
    });
  return loading;
}

export function playSfx(name: SfxName): void {
  if (!howl || getAudioSettings().muted) return;
  howl.play(name);
}

export function setMuted(muted: boolean): void {
  updateSettings({ ...getAudioSettings(), muted });
  howl?.mute(muted);
}

export function setVolume(volume: number): void {
  if (!Number.isFinite(volume)) return;
  const clamped = clampVolume(volume);
  updateSettings({ ...getAudioSettings(), volume: clamped });
  howl?.volume(clamped);
}

/** Browsers block audio until a user gesture, so loading waits for the first one. Returns a cleanup function. */
export function unlockOnFirstGesture(): () => void {
  if (typeof window === "undefined" || unlockRegistered || howl) return () => {};
  unlockRegistered = true;
  const remove = () => {
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
    unlockRegistered = false;
  };
  const onGesture = () => {
    remove();
    void initAudio();
  };
  window.addEventListener("pointerdown", onGesture);
  window.addEventListener("keydown", onGesture);
  return remove;
}
