"use client";

import type { Edgework } from "@bombappetit/engine";
import { memo, type ReactNode } from "react";
import { PortIcon } from "@/components/bomb/Edgework";
import { FacingHtml } from "./FacingHtml";
import { DEPTH, type CaseLayout } from "./layout";

const QUARTER = Math.PI / 2;
const LIFT = 0.04;

function Plate({
  title,
  column = false,
  children,
}: {
  title: string;
  column?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-4 border-[#15101f] bg-[#2b2247] px-6 py-4 text-[#fff6e9]">
      <span className="font-display text-2xl font-semibold tracking-widest text-[#b9b0d0] uppercase">
        {title}
      </span>
      <div className={`flex items-center justify-center gap-4 ${column ? "flex-col" : ""}`}>{children}</div>
    </div>
  );
}

const none = <span className="text-3xl text-[#b9b0d0]">none</span>;

/** Edgework on the four narrow sides: serial on top, ports underneath, batteries left, indicators right. */
export const EdgePlates = memo(function EdgePlates({
  edgework,
  layout,
}: {
  edgework: Edgework;
  layout: CaseLayout;
}) {
  const { width, height } = layout;
  return (
    <>
      <FacingHtml position={[0, height / 2 + LIFT, DEPTH / 4]} rotation={[-QUARTER, 0, 0]}>
        <Plate title="Serial number">
          <span className="rounded-xl bg-[#fff6e9] px-5 font-mono text-6xl leading-tight font-bold tracking-[0.2em] text-[#15101f]">
            {edgework.serial}
          </span>
        </Plate>
      </FacingHtml>

      <FacingHtml position={[0, -height / 2 - LIFT, 0]} rotation={[QUARTER, 0, 0]}>
        <Plate title="Port plates">
          {edgework.portPlates.length === 0
            ? none
            : edgework.portPlates.map((plate, i) => (
                <span
                  key={i}
                  aria-label={plate.length === 0 ? "Empty port plate" : undefined}
                  className="inline-flex min-h-20 min-w-24 items-center justify-center gap-2 rounded-xl border-4 border-[#15101f] bg-[#3a2f5c] px-3 [&_svg]:h-14 [&_svg]:w-[72px]"
                >
                  {plate.length === 0 ? (
                    <span className="text-2xl text-[#b9b0d0]">empty</span>
                  ) : (
                    plate.map((type) => <PortIcon key={type} type={type} />)
                  )}
                </span>
              ))}
        </Plate>
      </FacingHtml>

      <FacingHtml position={[-width / 2 - LIFT, 0, 0]} rotation={[0, -QUARTER, 0]}>
        <Plate title="Batteries" column>
          {edgework.batteries.length === 0
            ? none
            : edgework.batteries.map((kind, i) => (
                <span
                  key={i}
                  role="img"
                  aria-label={kind === "pack" ? "Holder with two batteries" : "Holder with one battery"}
                  className="inline-flex items-center gap-3 rounded-xl border-4 border-[#15101f] bg-[#3a2f5c] p-2 pr-4"
                >
                  {Array.from({ length: kind === "pack" ? 2 : 1 }, (_, cell) => (
                    <span key={cell} className="relative h-9 w-[72px] rounded-md bg-sun">
                      <span className="absolute top-2.5 -right-2 h-4 w-2 rounded-r-sm bg-sun" />
                    </span>
                  ))}
                </span>
              ))}
        </Plate>
      </FacingHtml>

      <FacingHtml position={[width / 2 + LIFT, 0, 0]} rotation={[0, QUARTER, 0]}>
        <Plate title="Indicators" column>
          {edgework.indicators.length === 0
            ? none
            : edgework.indicators.map((indicator) => (
                <span
                  key={indicator.label}
                  aria-label={`Indicator ${indicator.label}, ${indicator.lit ? "lit" : "unlit"}`}
                  className="inline-flex items-center gap-3 rounded-xl border-4 border-[#15101f] bg-[#3a2f5c] px-4 py-1"
                >
                  <span
                    aria-hidden
                    className={`size-7 rounded-full border-2 border-[#15101f] ${indicator.lit ? "bg-[#fff6e9] shadow-[0_0_16px_4px_#fff6e9]" : "bg-[#15101f]"}`}
                  />
                  <span className="font-mono text-4xl font-bold">{indicator.label}</span>
                  <span className="text-2xl text-[#b9b0d0]">{indicator.lit ? "lit" : "off"}</span>
                </span>
              ))}
        </Plate>
      </FacingHtml>
    </>
  );
});
