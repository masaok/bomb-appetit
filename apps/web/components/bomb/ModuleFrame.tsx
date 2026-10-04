"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export const FACE_SIZE = 300;

export type FrameStatus = "idle" | "solved" | "struck" | "needy";

const LIGHT: Record<FrameStatus, string> = {
  idle: "bg-[#3a2f5c]",
  solved: "bg-mint shadow-[0_0_10px_2px_#5fd3a6]",
  struck: "bg-tomato shadow-[0_0_12px_3px_#f04a3a]",
  needy: "bg-sun shadow-[0_0_10px_2px_#ffc94a]",
};

const STATUS_TEXT: Record<FrameStatus, string> = {
  idle: "not solved",
  solved: "solved",
  struck: "strike",
  needy: "needy module",
};

/**
 * The casing around one module: dark panel, status light, and a 300 x 300 logical
 * box that is scaled to whatever size the slot has.
 */
export function ModuleFrame({
  label,
  status,
  inert = false,
  children,
}: {
  label: string;
  status: FrameStatus;
  inert?: boolean;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / FACE_SIZE);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-label={`${label}, ${STATUS_TEXT[status]}`}
      className={`relative rounded-2xl border-2 border-[#15101f] bg-[#2b2247] p-2 shadow-[inset_0_0_0_3px_#3a2f5c] ${status === "struck" ? "module-struck" : ""}`}
    >
      <span
        aria-hidden
        className={`absolute top-2.5 right-2.5 z-10 size-3.5 rounded-full border-2 border-[#15101f] ${LIGHT[status]}`}
      />
      <div ref={box} className="relative aspect-square w-full overflow-hidden rounded-xl">
        <div
          inert={inert}
          className="absolute top-0 left-0 origin-top-left text-[#fff6e9]"
          style={{ width: FACE_SIZE, height: FACE_SIZE, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
