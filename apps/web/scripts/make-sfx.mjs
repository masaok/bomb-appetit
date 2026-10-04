import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050;
const GAP_MS = 100;
const EDGE_FADE_MS = 2;
const TAU = Math.PI * 2;

const WAV_PATH = fileURLToPath(new URL("../public/audio/sfx.wav", import.meta.url));
const SPRITE_PATH = fileURLToPath(new URL("../lib/audio/sprite.json", import.meta.url));

const samplesFor = (ms) => Math.round((ms * SAMPLE_RATE) / 1000);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(name) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return h >>> 0;
}

const sine = (phase) => Math.sin(phase * TAU);
const square = (phase) => (phase % 1 < 0.5 ? 1 : -1);
const decay = (t, tau) => Math.exp(-t / tau);
const lerp = (a, b, x) => a + (b - a) * x;

function render(ms, fn) {
  const out = new Float64Array(samplesFor(ms));
  for (let i = 0; i < out.length; i++) out[i] = fn(i / SAMPLE_RATE, i, out.length);
  return out;
}

/** Oscillator whose frequency can change per sample without phase jumps. */
function osc(wave) {
  let phase = 0;
  return (freq) => {
    const v = wave(phase);
    phase += freq / SAMPLE_RATE;
    return v;
  };
}

function lowpass() {
  let y = 0;
  return (x, cutoff) => {
    const k = 1 - Math.exp((-TAU * cutoff) / SAMPLE_RATE);
    y += k * (x - y);
    return y;
  };
}

function noiseSource(name) {
  const rand = mulberry32(seedFrom(name));
  return () => rand() * 2 - 1;
}

/** A plucked note: fundamental plus a quieter octave, with a fast attack and exponential tail. */
function chimeNote(t, start, freq, tau) {
  if (t < start) return 0;
  const u = t - start;
  const attack = Math.min(1, u / 0.004);
  return attack * decay(u, tau) * (sine(freq * u) + 0.35 * sine(freq * 2 * u) + 0.12 * sine(freq * 3 * u));
}

const SOUNDS = {
  // The countdown beep has to carry over laptop speakers and a voice call, so it is a
  // short tone at full level, not a soft click.
  // Durations keep every later sprite on a whole sample at 22050 Hz.
  tick: {
    ms: 80,
    peak: 0.85,
    make(ms) {
      const noise = noiseSource("tick");
      const lp = lowpass();
      return render(ms, (t) => decay(t, 0.03) * sine(880 * t) + 0.3 * decay(t, 0.002) * lp(noise(), 3000));
    },
  },
  tickFast: {
    ms: 85,
    peak: 0.9,
    make(ms) {
      const noise = noiseSource("tickFast");
      return render(
        ms,
        (t) =>
          decay(t, 0.022) * (0.6 * square(1320 * t) + 0.6 * sine(1320 * t)) +
          0.5 * decay(t, 0.0015) * noise(),
      );
    },
  },
  solved: {
    ms: 450,
    peak: 0.8,
    make(ms) {
      return render(ms, (t) => chimeNote(t, 0, 1046.5, 0.09) + chimeNote(t, 0.13, 1568, 0.11));
    },
  },
  strike: {
    ms: 500,
    peak: 0.85,
    make(ms) {
      const noise = noiseSource("strike");
      const lp = lowpass();
      const dur = ms / 1000;
      return render(ms, (t) => {
        const env = Math.min(1, t / 0.005) * Math.min(1, (dur - t) / 0.06);
        return env * (0.5 * square(110 * t) + 0.4 * square(116.5 * t) + 0.25 * lp(noise(), 2500));
      });
    },
  },
  needy: {
    ms: 300,
    peak: 0.7,
    make(ms) {
      const blip = (t, start, freq) => {
        const u = t - start;
        if (u < 0 || u > 0.13) return 0;
        const env = Math.min(1, u / 0.004) * Math.min(1, (0.13 - u) / 0.02);
        return env * (0.5 * square(freq * u) + 0.5 * sine(freq * u));
      };
      return render(ms, (t) => blip(t, 0, 880) + blip(t, 0.16, 660));
    },
  },
  explosion: {
    ms: 1500,
    peak: 0.95,
    make(ms) {
      const noise = noiseSource("explosion");
      const lp = lowpass();
      const rumble = osc(sine);
      const dur = ms / 1000;
      return render(ms, (t) => {
        const x = t / dur;
        const boom = decay(t, 0.28) * lp(noise(), lerp(4500, 180, Math.sqrt(x))) * 2.2;
        const low = decay(t, 0.5) * rumble(lerp(95, 32, x)) * 1.1;
        const crack = decay(t, 0.012) * noise() * 0.8;
        return Math.tanh(1.6 * (boom + low + crack));
      });
    },
  },
  defused: {
    ms: 1200,
    peak: 0.8,
    make(ms) {
      const notes = [
        [0, 523.25, 0.12],
        [0.13, 659.25, 0.12],
        [0.26, 783.99, 0.12],
        [0.39, 1046.5, 0.3],
        [0.39, 783.99, 0.3],
        [0.39, 659.25, 0.3],
      ];
      return render(ms, (t) => {
        let v = 0;
        for (const [start, freq, tau] of notes) {
          v += chimeNote(t, start, freq, tau);
          if (t >= start) v += 0.12 * decay(t - start, tau * 0.6) * square(freq * (t - start));
        }
        return v;
      });
    },
  },
  snip: {
    ms: 90,
    peak: 0.75,
    make(ms) {
      const noise = noiseSource("snip");
      const lp = lowpass();
      const sweep = osc(sine);
      return render(ms, (t) => {
        const n = noise();
        const hiss = n - lp(n, 2500);
        const blade = decay(t, 0.004) * hiss;
        const close = t >= 0.03 ? decay(t - 0.03, 0.008) * hiss * 0.8 : 0;
        return blade + close + 0.35 * decay(t, 0.015) * sweep(lerp(3200, 1200, t / 0.09));
      });
    },
  },
  click: {
    ms: 35,
    peak: 0.6,
    make(ms) {
      const noise = noiseSource("click");
      const sweep = osc(sine);
      return render(
        ms,
        (t) => decay(t, 0.005) * sweep(lerp(1500, 700, t / 0.035)) + 0.25 * decay(t, 0.001) * noise(),
      );
    },
  },
  clack: {
    ms: 55,
    peak: 0.65,
    make(ms) {
      const noise = noiseSource("clack");
      const lp = lowpass();
      const sweep = osc(sine);
      return render(
        ms,
        (t) => decay(t, 0.009) * sweep(lerp(520, 240, t / 0.055)) + 0.6 * decay(t, 0.003) * lp(noise(), 1800),
      );
    },
  },
};

function finish(samples, peak) {
  const fade = samplesFor(EDGE_FADE_MS);
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    const edge = Math.min(1, (i + 1) / fade, (samples.length - i) / fade);
    samples[i] *= edge;
    max = Math.max(max, Math.abs(samples[i]));
  }
  if (max === 0) throw new Error("sound rendered as silence");
  for (let i = 0; i < samples.length; i++) samples[i] *= peak / max;
  return samples;
}

function encodeWav(pcm) {
  const dataBytes = pcm.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < pcm.length; i++) buf.writeInt16LE(pcm[i], 44 + i * 2);
  return buf;
}

const sprite = {};
const placed = [];
let cursorMs = 0;
for (const [name, sound] of Object.entries(SOUNDS)) {
  const samples = finish(sound.make(sound.ms), sound.peak);
  sprite[name] = [cursorMs, sound.ms];
  placed.push({ name, start: samplesFor(cursorMs), samples });
  cursorMs += sound.ms + GAP_MS;
}

// The trailing gap keeps the last sprite from being clipped by decoders that round the file length down.
const pcm = new Int16Array(samplesFor(cursorMs));
for (const { start, samples } of placed) {
  for (let i = 0; i < samples.length; i++) pcm[start + i] = Math.round(samples[i] * 32767);
}

const wav = encodeWav(pcm);
mkdirSync(dirname(WAV_PATH), { recursive: true });
mkdirSync(dirname(SPRITE_PATH), { recursive: true });
writeFileSync(WAV_PATH, wav);
writeFileSync(SPRITE_PATH, `${JSON.stringify(sprite, null, 2)}\n`);

console.log(`sfx.wav: ${wav.length} bytes, ${(cursorMs / 1000).toFixed(2)} s`);
for (const { name, samples } of placed) {
  let peak = 0;
  let sumSq = 0;
  for (const v of samples) {
    peak = Math.max(peak, Math.abs(v));
    sumSq += v * v;
  }
  const [offset, duration] = sprite[name];
  const rms = Math.sqrt(sumSq / samples.length);
  console.log(
    `${name.padEnd(10)} offset ${String(offset).padStart(5)} ms  dur ${String(duration).padStart(5)} ms  peak ${peak.toFixed(2)}  rms ${rms.toFixed(3)}`,
  );
}
