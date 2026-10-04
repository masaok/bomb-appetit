/**
 * What the countdown display shows. Rules that read the timer ("release when any
 * digit is 4") read this text, so the Defuser and the engine always agree.
 * At 60 s or more: `M:SS`. Under 60 s: `SS.T` with tenths.
 */
export function timerText(remainingMs: number): string {
  const ms = Math.max(0, remainingMs);
  if (ms >= 60_000) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  const tenths = Math.floor(ms / 100);
  return `${String(Math.floor(tenths / 10)).padStart(2, "0")}.${tenths % 10}`;
}

export function timerDigits(remainingMs: number): number[] {
  return [...timerText(remainingMs)].filter((ch) => ch >= "0" && ch <= "9").map(Number);
}
