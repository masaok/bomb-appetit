import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { GITHUB_URL } from "@/components/marketing/links";
import { PageIntro } from "@/components/marketing/page-intro";
import { Mascot } from "@/components/mascot";

export const metadata: Metadata = {
  title: "Press kit",
  description: "Descriptions, fact sheet, logo, mascot and brand colors for writing about Bomb Appétit.",
};

const facts = [
  { label: "Genre", value: "Co-op party puzzle game" },
  { label: "Players", value: "2 to 5" },
  { label: "Platform", value: "Web browser" },
  { label: "Price", value: "Free" },
  { label: "Source", value: "Open. The code is MIT-licensed." },
  { label: "Website", value: "bombappetit.com" },
];

// Hex values match app/globals.css.
const colors = [
  { name: "Tomato", hex: "#f04a3a", use: "Primary buttons and accents" },
  { name: "Sun", hex: "#ffc94a", use: "Highlights" },
  { name: "Mint", hex: "#5fd3a6", use: "Success and badges" },
  { name: "Sky", hex: "#6ec1ff", use: "Secondary accents" },
  { name: "Grape", hex: "#5b4b9a", use: "Deep panels" },
  { name: "Blush", hex: "#ff8fa3", use: "Soft accents" },
  { name: "Ink", hex: "#221a38", use: "Text, outlines and shadows" },
  { name: "Cream", hex: "#fff6e9", use: "Page background" },
];

function SectionTitle({ children }: { children: string }) {
  return <h2 className="font-display text-3xl font-semibold tracking-tight">{children}</h2>;
}

export default function PressPage() {
  return (
    <>
      <PageIntro kicker="Press kit" title="Writing about Bomb Appétit?">
        Here is everything in one place. Copy what you need.
      </PageIntro>

      <div className="mx-auto flex max-w-4xl flex-col gap-14 px-6 pt-12 pb-24">
        <section>
          <SectionTitle>Descriptions</SectionTitle>
          <div className="mt-5 grid gap-6">
            <div className="sticker rounded-3xl bg-card p-6">
              <h3 className="font-display text-xl font-semibold">One line</h3>
              <p className="mt-2 text-muted">
                Bomb Appétit is a free co-op party game for your browser where one player defuses a bomb and
                everyone else reads the manual.
              </p>
            </div>
            <div className="sticker rounded-3xl bg-card p-6">
              <h3 className="font-display text-xl font-semibold">One paragraph</h3>
              <p className="mt-2 text-muted">
                Bomb Appétit is a co-op bomb defusal party game for two to five players. One player, the
                Defuser, sees a ticking bomb covered in puzzle modules. The others, the Experts, have the
                manual but can&apos;t see the bomb. They have to talk each other through it before the timer
                runs out. Every rule in the manual is generated from a seed, so there is a new manual whenever
                you want one. The game runs in a web browser, in the same room or in online rooms. It is free
                to play and the code is open source.
              </p>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>Fact sheet</SectionTitle>
          <dl className="sticker mt-5 grid overflow-hidden rounded-3xl bg-card sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.label} className="border-b-2 border-line/15 px-6 py-4">
                <dt className="font-display text-sm font-semibold uppercase tracking-widest text-tomato-text">
                  {fact.label}
                </dt>
                <dd className="mt-1 font-bold">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <SectionTitle>Logo and mascot</SectionTitle>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <figure className="sticker flex flex-col items-center gap-4 rounded-3xl bg-card p-6 text-center">
              <div className="grid min-h-44 place-items-center">
                <Logo className="text-3xl" />
              </div>
              <figcaption className="text-sm text-muted">
                The logo. Fizz on the left, the name on the right, with &quot;Appétit&quot; in tomato.
              </figcaption>
            </figure>
            <figure className="sticker flex flex-col items-center gap-4 rounded-3xl bg-sun p-6 text-center text-night">
              <Mascot className="h-44 w-auto" />
              <figcaption className="text-sm text-night/80">
                Fizz, the mascot. A cheerful bomb with a lit fuse and no sense of danger.
              </figcaption>
            </figure>
          </div>
          <div className="sticker mt-6 rounded-3xl bg-card p-6">
            <h3 className="font-display text-xl font-semibold">Usage notes</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted marker:text-tomato-text">
              <li>You can use the logo and Fizz in articles, videos and streams about the game.</li>
              <li>
                The Bomb Appétit name and logo are trademarks. The MIT license covers the code, not the name,
                logo or mascot.
              </li>
              <li>
                Do not use them in a way that implies we endorse or sponsor your product, event or channel.
              </li>
              <li>Keep the colors and proportions as they are. Fizz bruises easily.</li>
              <li>The name is two words: Bomb Appétit.</li>
            </ul>
          </div>
        </section>

        <section>
          <SectionTitle>Brand colors</SectionTitle>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {colors.map((color) => (
              <li key={color.name} className="sticker overflow-hidden rounded-2xl bg-card">
                <div
                  aria-hidden
                  className="h-20 border-b-2 border-line"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="px-4 py-3">
                  <p className="font-display text-lg font-semibold leading-tight">{color.name}</p>
                  <p className="font-mono text-sm">{color.hex}</p>
                  <p className="mt-1 text-sm text-muted">{color.use}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionTitle>Contact</SectionTitle>
          <p className="mt-4 text-lg text-muted">
            Questions, corrections or requests? Open an issue on GitHub. That is the fastest way to reach us.
          </p>
          <a
            href={`${GITHUB_URL}/issues`}
            className="sticker sticker-press mt-5 inline-block rounded-full bg-card px-7 py-3 font-display text-lg font-semibold"
          >
            Open a GitHub issue
          </a>
        </section>
      </div>
    </>
  );
}
