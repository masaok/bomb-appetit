import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Bomb Appétit, the co-op bomb defusal party game, with its smiling cartoon bomb mascot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const svg = await readFile(join(process.cwd(), "app/icon.svg"), "base64");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 64,
        background: "#fff6e9",
        color: "#221a38",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 400,
          height: 400,
          borderRadius: 200,
          background: "#5fd3a6",
        }}
      >
        <img src={`data:image/svg+xml;base64,${svg}`} width={320} height={320} alt="" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
        <div style={{ fontSize: 104, fontWeight: 700, lineHeight: 1 }}>Bomb Appétit</div>
        <div style={{ fontSize: 40, marginTop: 28, lineHeight: 1.25 }}>
          One of you sees the bomb. The rest have the manual. Talk fast.
        </div>
      </div>
    </div>,
    size,
  );
}
