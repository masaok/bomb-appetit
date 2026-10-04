const INK = "#221a38";

/** Fizz, the Bomb Appetit mascot. Colors are fixed so it looks the same in both themes. */
export function Mascot({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  return (
    <svg
      viewBox="0 0 240 270"
      className={className}
      {...(decorative
        ? { "aria-hidden": true }
        : {
            role: "img",
            "aria-label": "Fizz, a smiling cartoon bomb with a lit fuse",
          })}
    >
      <ellipse cx="120" cy="258" rx="64" ry="9" fill={INK} opacity=".15" />
      <g className="mascot-bob">
        {/* feet */}
        <ellipse cx="92" cy="244" rx="21" ry="12" fill={INK} />
        <ellipse cx="148" cy="244" rx="21" ry="12" fill={INK} />

        {/* arms */}
        <path d="M44 180Q26 186 24 204" fill="none" stroke={INK} strokeWidth="10" strokeLinecap="round" />
        <path
          className="mascot-wave"
          d="M196 172Q216 162 218 140"
          fill="none"
          stroke={INK}
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* fuse */}
        <path
          d="M120 76C120 44 156 58 164 32"
          fill="none"
          stroke={INK}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M120 76C120 44 156 58 164 32"
          fill="none"
          stroke="#e9b872"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <g className="mascot-spark">
          <path
            d="M166 4Q170 22 188 26Q170 30 166 48Q162 30 144 26Q162 22 166 4Z"
            transform="rotate(45 166 26)"
            fill="#f04a3a"
          />
          <path
            d="M166 4Q170 22 188 26Q170 30 166 48Q162 30 144 26Q162 22 166 4Z"
            fill="#ffc94a"
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="166" cy="26" r="4.5" fill="#fff" />
        </g>

        {/* body */}
        <rect x="97" y="66" width="46" height="28" rx="9" fill={INK} />
        <circle cx="120" cy="166" r="82" fill="#5b4b9a" stroke={INK} strokeWidth="5" />
        <ellipse cx="80" cy="122" rx="24" ry="12" transform="rotate(-35 80 122)" fill="#fff" opacity=".28" />

        {/* face */}
        <g className="mascot-blink">
          <ellipse cx="94" cy="160" rx="17" ry="20" fill="#fff" stroke={INK} strokeWidth="4" />
          <ellipse cx="146" cy="160" rx="17" ry="20" fill="#fff" stroke={INK} strokeWidth="4" />
          <circle cx="98" cy="164" r="9" fill={INK} />
          <circle cx="150" cy="164" r="9" fill={INK} />
          <circle cx="101" cy="160" r="3.5" fill="#fff" />
          <circle cx="153" cy="160" r="3.5" fill="#fff" />
        </g>
        <ellipse cx="68" cy="192" rx="13" ry="8" fill="#ff8fa3" />
        <ellipse cx="172" cy="192" rx="13" ry="8" fill="#ff8fa3" />
        <path d="M103 192Q120 216 137 192Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="120" cy="200" rx="7" ry="3.5" fill="#ff8fa3" />
      </g>
    </svg>
  );
}
