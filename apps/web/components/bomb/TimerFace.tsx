/** The countdown slot on the bomb: red LED digits and one light per allowed strike. */
export function TimerFace({
  timerText,
  strikes,
  strikeLimit,
}: {
  timerText: string;
  strikes: number;
  strikeLimit: number;
}) {
  return (
    <div
      className="flex size-full flex-col items-center justify-center gap-5"
      role="timer"
      aria-label={`Time left ${timerText}. ${strikes} of ${strikeLimit} strikes.`}
    >
      <div className="rounded-xl border-2 border-[#15101f] bg-[#15101f] px-5 py-3 shadow-[inset_0_0_18px_#000]">
        <span className="font-mono text-7xl font-bold tracking-tight text-tomato tabular-nums [text-shadow:0_0_14px_#f04a3a]">
          {timerText}
        </span>
      </div>
      <div className="flex gap-3" aria-hidden>
        {Array.from({ length: strikeLimit - 1 }, (_, i) => (
          <span
            key={i}
            className={`grid size-9 place-items-center rounded-lg border-2 border-[#15101f] font-display text-xl font-bold ${
              i < strikes ? "bg-tomato text-white shadow-[0_0_12px_2px_#f04a3a]" : "bg-[#3a2f5c] text-[#2b2247]"
            }`}
          >
            ✕
          </span>
        ))}
      </div>
    </div>
  );
}
