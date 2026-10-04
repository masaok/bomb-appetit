export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: "How many people can play?",
    a: "Two to five. One Defuser and one to four Experts.",
  },
  {
    q: "Do we need voice chat?",
    a: "You need to be able to talk, but the game doesn't do it for you. Sit in the same room, or use a phone or video call.",
  },
  {
    q: "Can the Experts see the bomb?",
    a: "No, and that's the whole game. Online, Experts only see the timer, the strike count and how many modules are solved.",
  },
  {
    q: "Can I play it now?",
    a: "Yes. Press Play, pick a mission or set up a freeplay bomb, and start talking. Nothing to install.",
  },
  {
    q: "How much does it cost?",
    a: "Nothing. Bomb Appetit is free to play, and the code is open source on GitHub.",
  },
  {
    q: "What devices and browsers does it work on?",
    a: "Any recent version of Chrome, Firefox, Safari or Edge, on a computer, tablet or phone. The bomb is easiest to handle on a bigger screen. The manual reads well on anything.",
  },
  {
    q: "Can I print the manual?",
    a: "Yes. Open the manual and use your browser's print command. It is laid out to print cleanly in black and white. Check that the rule seed on the paper matches the bomb.",
  },
  {
    q: "Do I need an account?",
    a: "No. Guests can play everything. You only need to sign in if you want your runs on the leaderboards.",
  },
  {
    q: "What is a rule seed?",
    a: "A number that generates the whole manual. Every seed gives a different set of rules, so answers from one seed are wrong for another. Rule seed 1 is the standard manual. The Defuser and the Experts must use the same seed.",
  },
  {
    q: "Are leaderboard runs verified?",
    a: "Yes. The server replays every submitted run from its recorded inputs. If the replay does not end the same way, the run is not listed.",
  },
  {
    q: "What are needy modules?",
    a: "Modules that can't be solved. They wake up now and then and need quick attention until the rest of the bomb is done. Ignore one for too long and you get a strike.",
  },
  {
    q: "Is it related to other bomb defusal games?",
    a: "No. Bomb Appetit is an original game in the same genre. It has its own rules, art and sounds.",
  },
];

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {items.map((faq) => (
        <details
          key={faq.q}
          className="sticker group rounded-2xl bg-card px-6 py-4"
        >
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
  );
}
