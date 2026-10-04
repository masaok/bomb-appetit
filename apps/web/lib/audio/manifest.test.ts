import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEFAULT_SFX, SFX_NAMES } from "./manifest";

const SAMPLE_RATE = 22050;
const GAP_MS = 100;

describe("DEFAULT_SFX", () => {
  it("points at the sprite file", () => {
    expect(DEFAULT_SFX.src).toEqual(["/audio/sfx.wav"]);
  });

  it("covers every sound name with a positive duration", () => {
    expect(Object.keys(DEFAULT_SFX.sprite).sort()).toEqual([...SFX_NAMES].sort());
    for (const name of SFX_NAMES) {
      const [offset, duration] = DEFAULT_SFX.sprite[name];
      expect(offset, name).toBeGreaterThanOrEqual(0);
      expect(duration, name).toBeGreaterThan(0);
    }
  });

  it("keeps sprites apart by at least the silence gap", () => {
    const ordered = SFX_NAMES.map((name) => DEFAULT_SFX.sprite[name]).sort((a, b) => a[0] - b[0]);
    let previousEnd = -GAP_MS;
    for (const [offset, duration] of ordered) {
      expect(offset).toBeGreaterThanOrEqual(previousEnd + GAP_MS);
      previousEnd = offset + duration;
    }
  });
});

describe("sfx.wav", () => {
  const wav = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../public/audio/sfx.wav"));

  it("has a 16-bit mono PCM RIFF header", () => {
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.readUInt32LE(4)).toBe(wav.length - 8);
    expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
    expect(wav.toString("ascii", 12, 16)).toBe("fmt ");
    expect(wav.readUInt16LE(20)).toBe(1);
    expect(wav.readUInt16LE(22)).toBe(1);
    expect(wav.readUInt32LE(24)).toBe(SAMPLE_RATE);
    expect(wav.readUInt16LE(34)).toBe(16);
    expect(wav.toString("ascii", 36, 40)).toBe("data");
  });

  it("has a data length that matches the end of the last sprite", () => {
    const dataBytes = wav.readUInt32LE(40);
    expect(dataBytes).toBe(wav.length - 44);

    const lastEndMs = Math.max(...SFX_NAMES.map((name) => DEFAULT_SFX.sprite[name][0] + DEFAULT_SFX.sprite[name][1]));
    const expectedSamples = Math.round(((lastEndMs + GAP_MS) * SAMPLE_RATE) / 1000);
    expect(dataBytes).toBe(expectedSamples * 2);
  });

  it("has audible content inside every sprite and silence between them", () => {
    const sampleAt = (index: number) => wav.readInt16LE(44 + index * 2);
    const toSample = (ms: number) => Math.round((ms * SAMPLE_RATE) / 1000);
    const peakBetween = (fromMs: number, toMs: number) => {
      let peak = 0;
      for (let i = toSample(fromMs); i < toSample(toMs); i++) peak = Math.max(peak, Math.abs(sampleAt(i)));
      return peak;
    };

    for (const name of SFX_NAMES) {
      const [offset, duration] = DEFAULT_SFX.sprite[name];
      expect(peakBetween(offset, offset + duration), name).toBeGreaterThan(8000);
      expect(peakBetween(offset + duration, offset + duration + GAP_MS), `gap after ${name}`).toBe(0);
    }
  });
});
