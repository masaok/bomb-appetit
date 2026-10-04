import type { Metadata } from "next";
import Link from "next/link";
import { FaqList, faqs } from "@/components/marketing/faq-list";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about Bomb Appetit: players, voice chat, cost, devices, printing the manual, accounts, rule seeds and verified runs.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PageIntro kicker="FAQ" title="Questions, defused">
        Short answers to the things people ask before the timer starts.
      </PageIntro>
      <section className="px-6 pt-10 pb-12">
        <FaqList items={faqs} />
      </section>
      <section className="px-6 pb-24 text-center">
        <p className="text-lg text-muted">
          Still stuck? Read{" "}
          <Link href="/how-to-play" className="font-bold text-ink underline hover:text-tomato-text">
            how to play
          </Link>
          , or just start a bomb and learn the loud way.
        </p>
        <Link
          href="/play"
          className="sticker sticker-press mt-6 inline-block rounded-full bg-tomato px-7 py-3 font-display text-lg font-semibold text-white"
        >
          Play now
        </Link>
      </section>
    </>
  );
}
