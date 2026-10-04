import type { BatteryKind, Edgework, PortType } from "@bombappetit/engine";

const PORT_NAMES: Record<PortType, string> = {
  hex: "Hex",
  twin: "Twin",
  ribbon: "Ribbon",
  coax: "Coax",
  slot: "Slot",
  trident: "Trident",
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinejoin: "round",
  strokeLinecap: "round",
} as const;

/** Original port drawings. Each has a distinct outline so they can be described aloud. */
export function PortIcon({ type }: { type: PortType }) {
  const shapes: Record<PortType, React.ReactNode> = {
    hex: <path d="M10 4h20l8 12-8 12H10L2 16z M14 16h12" {...stroke} />,
    twin: (
      <>
        <circle cx="12" cy="16" r="8" {...stroke} />
        <circle cx="28" cy="16" r="8" {...stroke} />
      </>
    ),
    ribbon: (
      <>
        <rect x="2" y="8" width="36" height="16" rx="3" {...stroke} />
        <path d="M8 13v6M14 13v6M20 13v6M26 13v6M32 13v6" {...stroke} />
      </>
    ),
    coax: (
      <>
        <circle cx="20" cy="16" r="12" {...stroke} />
        <circle cx="20" cy="16" r="3" fill="currentColor" />
      </>
    ),
    slot: (
      <>
        <rect x="4" y="5" width="32" height="22" rx="4" {...stroke} />
        <path d="M11 16h18" {...stroke} strokeWidth={5} />
      </>
    ),
    trident: <path d="M4 26V8M20 26V8M36 26V8M4 26h32" {...stroke} />,
  };
  return (
    <svg viewBox="0 0 40 32" className="h-7 w-9" role="img" aria-label={`${PORT_NAMES[type]} port`}>
      {shapes[type]}
    </svg>
  );
}

function Battery({ kind }: { kind: BatteryKind }) {
  const cells = kind === "pack" ? 2 : 1;
  return (
    <span
      role="img"
      aria-label={kind === "pack" ? "Holder with two batteries" : "Holder with one battery"}
      className="inline-flex items-center gap-0.5 rounded-md border-2 border-[#15101f] bg-[#3a2f5c] p-1"
    >
      {Array.from({ length: cells }, (_, i) => (
        <span key={i} className="relative h-4 w-8 rounded-sm bg-sun">
          <span className="absolute top-1 -right-1 h-2 w-1 rounded-r-sm bg-sun" />
        </span>
      ))}
    </span>
  );
}

function Plate({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-[#15101f] bg-[#2b2247] px-3 py-2">
      <span className="font-display text-xs font-semibold tracking-widest text-[#b9b0d0] uppercase">
        {title}
      </span>
      <div className="flex min-h-8 flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** The labels on the bomb's sides. The Defuser reads these out; the manual's rules refer to them. */
export function EdgeworkStrip({ edgework }: { edgework: Edgework }) {
  const none = <span className="text-sm text-[#b9b0d0]">none</span>;
  return (
    <div className="grid gap-3 text-[#fff6e9] sm:grid-cols-2 lg:grid-cols-4" aria-label="Edgework">
      <Plate title="Serial number">
        <span className="rounded-md bg-[#fff6e9] px-2 py-0.5 font-mono text-xl font-bold tracking-[0.2em] text-[#15101f]">
          {edgework.serial}
        </span>
      </Plate>
      <Plate title="Batteries">
        {edgework.batteries.length === 0
          ? none
          : edgework.batteries.map((kind, i) => <Battery key={i} kind={kind} />)}
      </Plate>
      <Plate title="Indicators">
        {edgework.indicators.length === 0
          ? none
          : edgework.indicators.map((indicator) => (
              <span
                key={indicator.label}
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-[#15101f] bg-[#3a2f5c] px-2 py-0.5"
                aria-label={`Indicator ${indicator.label}, ${indicator.lit ? "lit" : "unlit"}`}
              >
                <span
                  aria-hidden
                  className={`size-3 rounded-full border border-[#15101f] ${indicator.lit ? "bg-[#fff6e9] shadow-[0_0_8px_2px_#fff6e9]" : "bg-[#15101f]"}`}
                />
                <span className="font-mono text-sm font-bold">{indicator.label}</span>
                <span className="text-xs text-[#b9b0d0]">{indicator.lit ? "lit" : "off"}</span>
              </span>
            ))}
      </Plate>
      <Plate title="Port plates">
        {edgework.portPlates.length === 0
          ? none
          : edgework.portPlates.map((plate, i) => (
              <span
                key={i}
                className="inline-flex min-h-9 min-w-10 items-center gap-1 rounded-md border-2 border-[#15101f] bg-[#3a2f5c] px-1.5"
                aria-label={plate.length === 0 ? "Empty port plate" : undefined}
              >
                {plate.length === 0 ? (
                  <span className="text-xs text-[#b9b0d0]">empty</span>
                ) : (
                  plate.map((type) => <PortIcon key={type} type={type} />)
                )}
              </span>
            ))}
      </Plate>
    </div>
  );
}

export { PORT_NAMES };
