import { HeroMascot } from "@/components/hero-mascot";
import { Logo } from "@/components/logo";
import { Mascot } from "@/components/mascot";
import { ModuleIcon } from "@/components/module-icons";

const GITHUB_URL = "https://github.com/masaok/bomb-appetit";

const steps = [
  {
    title: "Pick your roles",
    body: "One brave Defuser gets the bomb. Everyone else becomes an Expert and gets the manual.",
    color: "bg-sun",
  },
  {
    title: "Talk it out",
    body: "Experts can't see the bomb. The Defuser can't see the manual. Describe, ask, repeat, panic.",
    color: "bg-sky",
  },
  {
    title: "Defuse or go boom",
    body: "Solve every module before the timer hits zero. Three strikes and dinner is ruined.",
    color: "bg-mint",
  },
];

const modules = [
  { id: "wires", name: "Wires", blurb: "Snip exactly one. Choose wisely." },
  { id: "big-button", name: "Big Button", blurb: "Tap it or hold it? Depends who you ask." },
  { id: "glyph-keypad", name: "Glyph Keypad", blurb: "Four strange symbols, one right order." },
  { id: "color-echo", name: "Color Echo", blurb: "Repeat the flashing colors. Sort of." },
  { id: "word-grid", name: "Word Grid", blurb: "Words that sound alike, read out loud." },
  { id: "recall", name: "Recall", blurb: "Five rounds of remembering what you pressed." },
  { id: "blinker", name: "Blinker", blurb: "That blinking light is spelling something." },
  { id: "tangled-wires", name: "Tangled Wires", blurb: "Stripes, stars and lights decide each cut." },
  { id: "wire-panels", name: "Wire Panels", blurb: "Page after page of wires to keep count of." },
  { id: "labyrinth", name: "Labyrinth", blurb: "Walk a maze only the Experts can map." },
  { id: "passcode", name: "Passcode", blurb: "Spin five letter wheels into a word." },
];

const needyModules = [
  { id: "pressure-vent", name: "Pressure Vent", blurb: "Demands a yes or no, right now." },
  { id: "discharge-lever", name: "Discharge Lever", blurb: "Hold it down before the meter fills." },
  { id: "dial-alignment", name: "Dial Alignment", blurb: "Turn the dial to match the lights." },
];

const tileColors = ["bg-sun", "bg-sky", "bg-mint", "bg-blush"];

const features = [
  {
    title: "A new manual every time",
    body: "Every rule is generated from a seed. Change the seed and the whole manual changes, so nobody can memorize the answers.",
  },
  {
    title: "Nothing to install",
    body: "It runs in the browser. Open the bomb on a laptop and the manual on a phone, or print the manual on paper.",
  },
  {
    title: "Same couch or far apart",
    body: "Play in one room, or share a five-letter room code and talk over a call. Experts see the timer and strikes, never the bomb.",
  },
  {
    title: "Built in the open",
    body: "The game, every module and the rule generator are developed in a public GitHub repository.",
  },
];

const faqs = [
  {
    q: "How many people can play?",
    a: "Two to five. One Defuser and one to four Experts.",
  },
  {
    q: "Do we need voice chat?",
    a: "You need to be able to talk, but the game doesn't do it for you. Sit in the same room, or use a phone or Discord call.",
  },
  {
    q: "Can the Experts see the bomb?",
    a: "No, and that's the whole game. Online, Experts only see the timer, the strike count and how many modules are solved.",
  },
  {
    q: "Can I play it now?",
    a: "Not yet. Bomb Appetit is in development. Follow the GitHub repository to see it come together.",
  },
];

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-tomato">
        {kicker}
      </p>
      <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

function ModuleCard({
  module,
  index,
}: {
  module: { id: string; name: string; blurb: string };
  index: number;
}) {
  return (
    <li className="sticker flex items-center gap-4 rounded-2xl bg-card p-4">
      <span
        className={`grid size-14 shrink-0 place-items-center rounded-xl border-2 border-night text-night ${tileColors[index % tileColors.length]}`}
      >
        <ModuleIcon id={module.id} className="size-9" />
      </span>
      <div>
        <h3 className="font-display text-lg font-semibold leading-tight">
          {module.name}
        </h3>
        <p className="text-sm text-muted">{module.blurb}</p>
      </div>
    </li>
  );
}

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-6 font-bold">
          <a href="#how" className="hidden hover:text-tomato sm:block">
            How it works
          </a>
          <a href="#modules" className="hidden hover:text-tomato sm:block">
            Modules
          </a>
          <a href="#faq" className="hidden hover:text-tomato sm:block">
            FAQ
          </a>
          <a
            href={GITHUB_URL}
            className="sticker sticker-press rounded-full bg-card px-4 py-1.5"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-10 pb-20 lg:grid-cols-2 lg:pt-16">
          <div className="text-center lg:text-left">
            <p className="sticker inline-block -rotate-2 rounded-full bg-mint px-4 py-1 text-sm font-extrabold text-night">
              In development · coming soon
            </p>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              One bomb. One manual.{" "}
              <span className="text-tomato">Lots of yelling.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted sm:text-xl lg:mx-0">
              Bomb Appetit is a co-op party game for your browser. One of you
              sees a ticking bomb. The rest of you have the manual. Talk each
              other through it before the timer runs out.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              <a
                href="#how"
                className="sticker sticker-press rounded-full bg-tomato px-7 py-3 font-display text-lg font-semibold text-white"
              >
                See how it works
              </a>
              <a
                href={GITHUB_URL}
                className="sticker sticker-press rounded-full bg-card px-7 py-3 font-display text-lg font-semibold"
              >
                Follow on GitHub
              </a>
            </div>
            <p className="mt-5 text-sm font-bold text-muted">
              2–5 players · no install · bring your own voices
            </p>
          </div>
          <HeroMascot />
        </section>

        <section id="how" className="scroll-mt-8 px-6 py-20">
          <SectionHeading kicker="How it works" title="Three steps to a very loud evening" />
          <ol className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="sticker rounded-3xl bg-card p-6">
                <span
                  className={`grid size-12 place-items-center rounded-full border-2 border-night font-display text-xl font-bold text-night ${step.color}`}
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-6 grid max-w-6xl gap-6 md:grid-cols-2">
            <div className="sticker rounded-3xl bg-grape p-6 text-white">
              <h3 className="font-display text-2xl font-semibold">
                The Defuser
              </h3>
              <p className="mt-2 text-white/85">
                Sees the bomb: wires, buttons, blinking lights and a countdown.
                Has no idea what any of it means.
              </p>
            </div>
            <div className="sticker rounded-3xl bg-sun p-6 text-night">
              <h3 className="font-display text-2xl font-semibold">
                The Experts
              </h3>
              <p className="mt-2 text-night/80">
                Have the manual with every rule in it. Have no idea what the
                bomb looks like.
              </p>
            </div>
          </div>
        </section>

        <section id="modules" className="scroll-mt-8 px-6 py-20">
          <SectionHeading kicker="On the menu" title="Eleven modules, each its own little puzzle" />
          <ul className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, i) => (
              <ModuleCard key={module.id} module={module} index={i} />
            ))}
          </ul>
          <h3 className="mx-auto mt-12 max-w-2xl text-center font-display text-2xl font-semibold text-balance">
            Plus three needy modules that can&apos;t be solved, only kept happy
          </h3>
          <ul className="mx-auto mt-6 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {needyModules.map((module, i) => (
              <ModuleCard key={module.id} module={module} index={i + 3} />
            ))}
          </ul>
        </section>

        <section className="px-6 py-20">
          <SectionHeading kicker="Why you'll like it" title="Made for game night" />
          <ul className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature.title} className="sticker rounded-3xl bg-card p-6">
                <h3 className="font-display text-2xl font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-muted">{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="faq" className="scroll-mt-8 px-6 py-20">
          <SectionHeading kicker="FAQ" title="Questions, defused" />
          <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="sticker group rounded-2xl bg-card px-6 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-semibold [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span
                    aria-hidden
                    className="text-2xl text-tomato transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-6 pt-8 pb-24">
          <div className="sticker mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-[2rem] bg-tomato px-8 py-10 text-center text-white sm:flex-row sm:text-left">
            <Mascot decorative className="h-36 w-auto shrink-0" />
            <div>
              <h2 className="font-display text-3xl font-semibold text-balance sm:text-4xl">
                Fizz is still in the oven
              </h2>
              <p className="mt-2 text-lg text-white/90">
                The game is being built in the open. Star the repository to
                follow along.
              </p>
              <a
                href={GITHUB_URL}
                className="sticker sticker-press mt-5 inline-block rounded-full bg-sun px-7 py-3 font-display text-lg font-semibold text-night"
              >
                Follow on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-line px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo className="text-xl" />
          <p className="text-sm text-muted">
            © 2026 Bomb Appetit. No real bombs were harmed.
          </p>
          <a href={GITHUB_URL} className="text-sm font-bold hover:text-tomato">
            GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
