import {
  INDICATOR_LABELS,
  MAX_RULE_SEED,
  MODULE_IDS,
  MODULES,
  PORT_TYPES,
  ruleBook,
  STANDARD_RULE_SEED,
} from "@bombappetit/engine";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PORT_NAMES, PortIcon } from "@/components/bomb/Edgework";
import { Logo } from "@/components/logo";
import { ManualTools } from "@/components/manual/ManualTools";
import { ManualLead, ManualSubheading, ManualTable } from "@/components/manual/primitives";
import { ModuleManual } from "@/components/modules/manuals";

function parseSeed(raw: string): number | null {
  if (!/^[1-9]\d{0,5}$/.test(raw)) return null;
  const seed = Number(raw);
  return seed <= MAX_RULE_SEED ? seed : null;
}

// The standard manual is built ahead of time. Any other seed is generated on first request.
export function generateStaticParams() {
  return [{ ruleSeed: String(STANDARD_RULE_SEED) }];
}

export async function generateMetadata({ params }: PageProps<"/manual/[ruleSeed]">): Promise<Metadata> {
  const seed = parseSeed((await params).ruleSeed);
  return {
    title: seed === null ? "Manual" : `Bomb defusal manual ${seed}`,
    description: "The Experts' manual. Read it aloud. Never show it to the Defuser's screen.",
  };
}

const GLOSSARY: [string, string][] = [
  ["Defuser", "The one player who can see and touch the bomb."],
  ["Expert", "Everyone holding this manual. Experts never see the bomb."],
  ["Module", "One puzzle panel on the bomb. Solve every regular module to defuse it."],
  ["Needy module", "A module that cannot be solved. It wakes up now and then and must be kept happy."],
  ["Strike", "A mistake. Each strike speeds up the countdown. The last allowed strike sets the bomb off."],
  ["Edgework", "The labels on the bomb's casing: serial number, batteries, indicators and ports."],
  ["Rule seed", "The number of this manual. A bomb only works with the manual that has its rule seed."],
];

export default async function ManualPage({ params }: PageProps<"/manual/[ruleSeed]">) {
  const ruleSeed = parseSeed((await params).ruleSeed);
  if (ruleSeed === null) notFound();
  const book = ruleBook(ruleSeed);

  const entries = [
    { id: "intro", title: "How to use this manual" },
    ...MODULE_IDS.map((id) => ({ id, title: MODULES[id].name })),
    { id: "edgework", title: "Appendix: edgework" },
    { id: "glossary", title: "Glossary" },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-6 lg:grid-cols-[15rem_1fr] print:block print:max-w-none print:p-0">
      <aside className="no-print lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
        <Logo className="text-xl" />
        <div className="mt-5">
          <ManualTools entries={entries} ruleSeed={ruleSeed} />
        </div>
      </aside>

      <main className="min-w-0 text-lg leading-relaxed sm:text-base">
        <section id="intro" className="manual-page scroll-mt-4">
          <p className="font-display text-sm font-semibold tracking-widest text-tomato-text uppercase print:text-black">
            Bomb Appétit · manual {ruleSeed}
            {ruleSeed === STANDARD_RULE_SEED && " (standard)"}
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Bomb defusal manual
          </h1>
          <ManualLead>
            You are an Expert. The Defuser can see the bomb and you cannot. You have the rules and the Defuser
            does not. Ask what they see. Tell them what to do. Do not look at their screen.
          </ManualLead>
          <ManualLead>
            This is manual number <strong>{ruleSeed}</strong>. Check that the Defuser&apos;s bomb uses rule
            seed <strong>{ruleSeed}</strong>. A different number means different rules, and these pages will
            get you blown up.
          </ManualLead>
          <ManualSubheading>Before you start</ManualSubheading>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Ask the Defuser to read out the edgework: serial number, batteries, indicators and ports.</li>
            <li>Ask which modules are on the bomb, front and back. Solve them in any order.</li>
            <li>Split the pages between Experts so that two people never search for the same thing.</li>
            <li>Repeat instructions back before the Defuser acts. A wrong move is a strike.</li>
          </ul>
        </section>

        {MODULE_IDS.map((id) => (
          <section
            key={id}
            id={id}
            className="manual-page mt-12 scroll-mt-4 border-t-2 border-line pt-6 print:mt-0 print:border-0 print:pt-0"
          >
            <p className="text-sm font-bold tracking-widest text-muted uppercase">
              {MODULES[id].kind === "needy" ? "Needy module" : "Module"}
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight">{MODULES[id].name}</h2>
            <ModuleManual id={id} book={book} />
          </section>
        ))}

        <section
          id="edgework"
          className="manual-page mt-12 scroll-mt-4 border-t-2 border-line pt-6 print:mt-0 print:border-0 print:pt-0"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight">Appendix: edgework</h2>
          <ManualLead>
            Edgework is printed on the bomb&apos;s casing. Many rules refer to it. Ask for all of it once, at
            the start, and write it down.
          </ManualLead>
          <ManualSubheading>Serial number</ManualSubheading>
          <p className="mt-2 max-w-prose">
            Six characters. The last one is always a digit. The letters I and O are never used, so a round
            character is a zero and a straight one is a one. The vowels are A, E and U.
          </p>
          <ManualSubheading>Batteries</ManualSubheading>
          <p className="mt-2 max-w-prose">
            A bomb has zero to four battery holders. A holder carries one battery or a pack of two. Rules
            count batteries, not holders, unless they say holders.
          </p>
          <ManualSubheading>Indicators</ManualSubheading>
          <p className="mt-2 max-w-prose">
            An indicator is a three-letter label beside a light. The light is lit or unlit. The possible
            labels are: <span className="font-mono font-bold">{INDICATOR_LABELS.join(", ")}</span>.
          </p>
          <ManualSubheading>Ports</ManualSubheading>
          <ManualTable
            head={["Port", "Name", "How to recognise it"]}
            rows={PORT_TYPES.map((type) => [
              <PortIcon key="icon" type={type} />,
              PORT_NAMES[type],
              {
                hex: "A six-sided outline with one bar across the middle.",
                twin: "Two round sockets side by side.",
                ribbon: "A wide rectangle with five short pins.",
                coax: "One large ring with a solid dot in the centre.",
                slot: "A rounded box with one thick horizontal slot.",
                trident: "Three upright prongs on a base line.",
              }[type],
            ])}
          />
        </section>

        <section
          id="glossary"
          className="manual-page mt-12 scroll-mt-4 border-t-2 border-line pt-6 print:mt-0 print:border-0 print:pt-0"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight">Glossary</h2>
          <dl className="mt-3 grid gap-2">
            {GLOSSARY.map(([term, meaning]) => (
              <div key={term}>
                <dt className="inline font-bold">{term}. </dt>
                <dd className="inline">{meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
