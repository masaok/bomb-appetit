"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_AUDIO_SETTINGS,
  getAudioSettings,
  playSfx,
  setMuted,
  setVolume,
  subscribeAudioSettings,
  unlockOnFirstGesture,
} from "@/lib/audio/player";

const getServerSettings = () => DEFAULT_AUDIO_SETTINGS;

export function AudioControls({ className = "" }: { className?: string }) {
  const { muted, volume } = useSyncExternalStore(subscribeAudioSettings, getAudioSettings, getServerSettings);

  useEffect(() => unlockOnFirstGesture(), []);

  const silent = muted || volume === 0;

  return (
    <div
      className={`sticker inline-flex items-center gap-3 rounded-full bg-card px-3 py-2 text-ink ${className}`}
    >
      <button
        type="button"
        aria-pressed={muted}
        aria-label="Mute sound"
        title={muted ? "Unmute sound" : "Mute sound"}
        onClick={() => {
          setMuted(!muted);
          if (muted) playSfx("click");
        }}
        className={`sticker-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-line text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
          muted ? "bg-tomato" : "bg-sun"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
          {silent ? (
            <path d="M16 9.5l5 5m0-5l-5 5" />
          ) : (
            <>
              <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
              {volume > 0.5 && <path d="M18 7a7 7 0 0 1 0 10" />}
            </>
          )}
        </svg>
      </button>
      <input
        type="range"
        aria-label="Volume"
        aria-valuetext={`${Math.round(volume * 100)}%`}
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(e.currentTarget.valueAsNumber)}
        className={`h-2 w-24 cursor-pointer accent-tomato ${muted ? "opacity-50" : ""}`}
      />
    </div>
  );
}
