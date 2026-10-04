import type { Metadata } from "next";
import { Fredoka, Geist_Mono, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AudioManifest } from "@/components/hud/AudioManifest";
import { cloud } from "@/lib/cloud";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "A co-op bomb defusal party game for your browser. One player sees the bomb, everyone else has the manual. Talk fast.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bombappetit.com"),
  title: {
    default: "Bomb Appetit, the co-op bomb defusal party game",
    template: "%s · Bomb Appetit",
  },
  description,
  openGraph: {
    title: "Bomb Appetit",
    description,
    url: "/",
    siteName: "Bomb Appetit",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        {cloud.assetManifest.sfx ? <AudioManifest sfx={cloud.assetManifest.sfx} /> : null}
        {/* Collects only on Vercel deployments; a local or self-hosted run sends nothing. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
