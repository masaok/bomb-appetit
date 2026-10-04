import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageIntro } from "@/components/marketing/page-intro";
import { Mascot } from "@/components/mascot";
import { ModuleIcon } from "@/components/module-icons";

export const metadata: Metadata = {
  title: "How to play",
  description:
    "Learn Bomb Appetit in five minutes: roles, setup for same-room and online play, the timer, strikes, edgework, needy modules and rule seeds.",
};

const needs = [
  {
    title: "Two screens, or one and a printer",
    body: "The bomb goes on one device. The manual goes on another, or on paper.",
    color: "bg-sun",
  },
  {
    title: "A way to talk",
    body: "Sit in the same room, or start a phone or video call. The game has no voice chat of its own.",
    color: "bg-sky",
  },
  {
    title: "Two to five people",
    body: "One Defuser and one to four Experts. More Experts means more opinions.",
    color: "bg-mint",
  },
];

const sameRoomSteps = [
  "The Defuser opens Play and picks a mission or a freeplay bomb.",
  "The Experts open the manual on their own devices, or print it.",
  "Check that the rule seed on the manual matches the bomb.",
  "Turn the bomb screen away from the Experts. No peeking.",
  "Start the bomb and start talking.",
];

const onlineSteps = [
  "The host opens Play and creates a room.",
  "The host shares the five-letter room code.",
  "Everyone else joins with the code.",
  "Each player picks Defuser or Expert. There is one Defuser per bomb.",
  "Get on a call together, then the host starts the bomb.",
];

const edgework = [
  {
    title: "Serial number",
    body: "A short code of letters and digits. Rules often ask about its last digit or whether it has a vowel.",
    color: "bg-sun",
  },
  {
    title: "Batteries",
    body: "Count them all. Check every side of the bomb before you answer.",
    color: "bg-mint",
  },
  {
    title: "Indicators",
    body: "Small labels with three letters and a light. The light is either lit or unlit, and that matters.",
    color: "bg-sky",
  },
  {
    title: "Ports",
    body: "Sockets for cables that will never be plugged in. Rules care about which types are there.",
    color: "bg-blush",
  },
];

const moduleExamples = [
  { id: "wires", name: "Wires" },
  { id: "big-button", name: "Big Button" },
  { id: "glyph-keypad", name: "Glyph Keypad" },
  { id: "labyrinth", name: "Labyrinth" },
  { id: "passcode", name: "Passcode" },
];

const needyModules = [
  {
    id: "pressure-vent",
    name: "Pressure Vent",
    body: "Asks a yes or no question. Answer before its timer ends.",
  },
  {
    id: "discharge-lever",
    name: "Discharge Lever",
    body: "A meter fills up. Hold the lever to drain it.",
  },
  {
    id: "dial-alignment",
    name: "Dial Alignment",
    body: "Lights change. Turn the dial to the matching position.",
  },
];

const tips = [
  {
    title: "Describe first, then ask",
    body: "Defuser, say what you see before anyone guesses. \"Four wires. Red, blue, blue, white.\"",
  },
  {
    title: "Read edgework early",
    body: "Give the Experts the serial number, batteries, indicators and ports at the start. They will need them later.",
  },
  {
    title: "Repeat it back",
    body: "Experts, give one clear instruction. Defuser, say it back before you act.",
  },
  {
    title: "Agree on words",
    body: "Pick names for odd symbols and stick with them. \"The squiggly one\" only works once.",
  },
  {
    title: "Split the manual",
    body: "With several Experts, give each one a few modules to own. Nobody has to flip pages in a panic.",
  },
  {
    title: "Stay calm, mostly",
    body: "A strike is not the end. Take a breath, then go faster.",
  },
];

function Section({
  id,
  kicker,
  title,
  lead,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-tomato">
        {kicker}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {lead ? <p className="mt-3 max-w-3xl text-lg text-muted">{lead}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function StepList({ steps, color }: { steps: string[]; color: string }) {
  return (
    <ol className="mt-4 flex flex-col gap-3">
      {steps.map((step, i) => (
        <li key={step} className="flex items-start gap-3">
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full border-2 border-night font-display text-sm font-bold text-night ${color}`}
          >
            {i + 1}
          </span>
          <span className="text-muted">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function IconTile({ id, color }: { id: string; color: string }) {
  return (
    <span
      className={`grid size-14 shrink-0 place-items-center rounded-xl border-2 border-night text-night ${color}`}
    >
      <ModuleIcon id={id} className="size-9" />
    </span>
  );
}

export default function HowToPlayPage() {
  return (
    <>
      <PageIntro kicker="How to play" title="Learn it in five minutes">
        One of you sees the bomb. The rest of you have the manual. Nobody sees
        both. Talk each other through it before the timer runs out.
      </PageIntro>

      <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 pt-12 pb-16">
        <Section id="roles" kicker="Roles" title="Two jobs, one bomb">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="sticker rounded-3xl bg-grape p-6 text-white">
              <h3 className="font-display text-2xl font-semibold">
                The Defuser
              </h3>
              <p className="mt-2 text-white/85">
                Sees the bomb and is the only one who can touch it. Describes
                every module out loud and does what the Experts say. Can&apos;t
                look at the manual.
              </p>
            </div>
            <div className="sticker rounded-3xl bg-sun p-6 text-night">
              <h3 className="font-display text-2xl font-semibold">
                The Experts
              </h3>
              <p className="mt-2 text-night/80">
                Have the manual with every rule in it. Ask questions, look up
                the answer and tell the Defuser what to do. Can&apos;t look at
                the bomb.
              </p>
            </div>
          </div>
        </Section>

        <Section id="what-you-need" kicker="Before you start" title="What you need">
          <ul className="grid gap-6 md:grid-cols-3">
            {needs.map((need) => (
              <li key={need.title} className="sticker rounded-3xl bg-card p-6">
                <span
                  aria-hidden
                  className={`block h-3 w-12 rounded-full border-2 border-night ${need.color}`}
                />
                <h3 className="mt-4 font-display text-xl font-semibold">
                  {need.title}
                </h3>
                <p className="mt-2 text-muted">{need.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="setup"
          kicker="Setup"
          title="Same room or far apart"
          lead="Both ways play the same. Pick the one that fits your evening."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="sticker rounded-3xl bg-card p-6">
              <h3 className="font-display text-2xl font-semibold">
                In the same room
              </h3>
              <StepList steps={sameRoomSteps} color="bg-sun" />
            </div>
            <div className="sticker rounded-3xl bg-card p-6">
              <h3 className="font-display text-2xl font-semibold">
                In an online room
              </h3>
              <StepList steps={onlineSteps} color="bg-sky" />
              <p className="mt-4 text-sm text-muted">
                Online, Experts see the timer, the strike count and how many
                modules are solved. They never see the bomb.
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="timer-and-strikes"
          kicker="The pressure"
          title="The timer and strikes"
          lead="Solve every module before the timer hits zero. Every mistake is a strike, and strikes make the clock run faster."
        >
          <ol className="grid gap-4 sm:grid-cols-3">
            <li className="sticker rounded-3xl bg-card p-6">
              <p className="font-display text-lg font-semibold">First strike</p>
              <p className="mt-1 font-mono text-4xl font-bold text-tomato">
                x1.25
              </p>
              <p className="mt-2 text-muted">The timer speeds up a little.</p>
            </li>
            <li className="sticker rounded-3xl bg-card p-6">
              <p className="font-display text-lg font-semibold">Second strike</p>
              <p className="mt-1 font-mono text-4xl font-bold text-tomato">
                x1.5
              </p>
              <p className="mt-2 text-muted">Now it is properly rude.</p>
            </li>
            <li className="sticker rounded-3xl bg-tomato p-6 text-white">
              <p className="font-display text-lg font-semibold">Third strike</p>
              <p className="mt-1 font-display text-4xl font-bold">Boom</p>
              <p className="mt-2 text-white/90">
                The bomb goes off. So does the group chat.
              </p>
            </li>
          </ol>
          <p className="mt-5 text-muted">
            Three strikes is the default. The bomb also goes off if the timer
            reaches zero, no matter how few strikes you have.
          </p>
        </Section>

        <Section
          id="edgework"
          kicker="Edgework"
          title="Look at the sides of the bomb"
          lead="The casing has details on its sides. The manual's rules refer to them all the time, so the Defuser should read them out early."
        >
          <ul className="grid gap-4 sm:grid-cols-2">
            {edgework.map((item) => (
              <li key={item.title} className="sticker rounded-2xl bg-card p-5">
                <h3 className="flex items-center gap-3 font-display text-xl font-semibold">
                  <span
                    aria-hidden
                    className={`size-4 shrink-0 rounded-full border-2 border-night ${item.color}`}
                  />
                  {item.title}
                </h3>
                <p className="mt-2 text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-muted">
            A typical rule sounds like this: &quot;If there is more than one
            battery and the serial number ends in an odd digit, cut the last
            wire.&quot; Your manual will have its own version.
          </p>
        </Section>

        <Section
          id="modules"
          kicker="Modules"
          title="Regular modules and needy ones"
          lead="Each module is a small puzzle with its own page in the manual. Solve one and its light turns green. Solve them all and the bomb is defused."
        >
          <ul className="flex flex-wrap gap-3">
            {moduleExamples.map((module, i) => (
              <li
                key={module.id}
                className="sticker flex items-center gap-3 rounded-2xl bg-card py-2 pr-5 pl-2"
              >
                <IconTile
                  id={module.id}
                  color={["bg-sun", "bg-sky", "bg-mint", "bg-blush"][i % 4] ?? "bg-sun"}
                />
                <span className="font-display text-lg font-semibold">
                  {module.name}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="mt-10 font-display text-2xl font-semibold">
            Needy modules
          </h3>
          <p className="mt-2 max-w-3xl text-muted">
            Needy modules can&apos;t be solved. They wake up now and then and
            want attention right away. Leave one alone for too long and you get
            a strike. Keep them happy while you work on everything else.
          </p>
          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {needyModules.map((module) => (
              <li
                key={module.id}
                className="sticker flex items-start gap-4 rounded-2xl bg-card p-4"
              >
                <IconTile id={module.id} color="bg-blush" />
                <div>
                  <h4 className="font-display text-lg font-semibold leading-tight">
                    {module.name}
                  </h4>
                  <p className="text-sm text-muted">{module.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="rule-seeds"
          kicker="Rule seeds"
          title="A new manual every time"
        >
          <div className="sticker rounded-3xl bg-mint p-6 text-night">
            <p className="text-lg text-night/85">
              Every rule in the manual is generated from a number called the
              rule seed. Change the seed and every rule changes with it, so
              nobody can memorize the answers.
            </p>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-night/85">
              <li>Rule seed 1 is the standard manual. Start there.</li>
              <li>The bomb and the manual must use the same seed.</li>
              <li>
                Printed a manual? Check the seed on the page before you start.
              </li>
            </ul>
            <Link
              href="/manual/1"
              className="sticker sticker-press mt-5 inline-block rounded-full bg-card px-6 py-2.5 font-display text-lg font-semibold text-ink"
            >
              Open the standard manual
            </Link>
          </div>
        </Section>

        <Section id="tips" kicker="Talking" title="Communication tips">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tips.map((tip) => (
              <li key={tip.title} className="sticker rounded-2xl bg-card p-5">
                <h3 className="font-display text-xl font-semibold">
                  {tip.title}
                </h3>
                <p className="mt-2 text-muted">{tip.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <section className="px-6 pt-8 pb-24">
        <div className="sticker mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-[2rem] bg-tomato px-8 py-10 text-center text-white sm:flex-row sm:text-left">
          <Mascot decorative className="h-36 w-auto shrink-0" />
          <div>
            <h2 className="font-display text-3xl font-semibold text-balance sm:text-4xl">
              That&apos;s the whole briefing
            </h2>
            <p className="mt-2 text-lg text-white/90">
              Grab a friend, pick who holds the bomb and try the first mission.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-4 sm:justify-start">
              <Link
                href="/play"
                className="sticker sticker-press inline-block rounded-full bg-sun px-7 py-3 font-display text-lg font-semibold text-night"
              >
                Play now
              </Link>
              <Link
                href="/missions"
                className="sticker sticker-press inline-block rounded-full bg-card px-7 py-3 font-display text-lg font-semibold text-ink"
              >
                See the missions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
