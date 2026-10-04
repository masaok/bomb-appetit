import type { ReactNode } from "react";

/** Intro paragraph under a module's manual heading. */
export function ManualLead({ children }: { children: ReactNode }) {
  return <p className="mt-2 max-w-prose text-base leading-relaxed">{children}</p>;
}

export function ManualSubheading({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 font-display text-xl font-semibold break-after-avoid">{children}</h3>;
}

/** Numbered rules that are read top to bottom, first match wins. */
export function RuleList({ children }: { children: ReactNode }) {
  return <ol className="mt-2 list-decimal space-y-1 pl-6 leading-relaxed marker:font-bold">{children}</ol>;
}

/** A bordered table that prints cleanly in black and white. */
export function ManualTable({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="manual-table">
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th key={i} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A color named in words with a swatch beside it, so it still reads in black and white. */
export function ColorWord({ name, hex }: { name: string; hex: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-bold whitespace-nowrap">
      <span aria-hidden className="inline-block size-3 rounded-full border border-current" style={{ background: hex }} />
      {name.toLowerCase()}
    </span>
  );
}
