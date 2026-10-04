import type { Metadata } from "next";
import { GITHUB_URL } from "@/components/marketing/links";
import { PageIntro } from "@/components/marketing/page-intro";
import { changelog } from "@/data/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What is new in Bomb Appétit, version by version.",
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

function formatDate(iso: string) {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

export default function ChangelogPage() {
  return (
    <>
      <PageIntro kicker="Changelog" title="What's new">
        Every release, newest first.
      </PageIntro>
      <section className="px-6 pt-10 pb-12">
        <ol className="mx-auto flex max-w-3xl flex-col gap-6">
          {changelog.map((entry) => (
            <li key={entry.version} className="sticker rounded-3xl bg-card p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border-2 border-night bg-sun px-3 py-0.5 font-mono text-sm font-bold text-night">
                  v{entry.version}
                </span>
                <time dateTime={entry.date} className="text-sm font-bold text-muted">
                  {formatDate(entry.date)}
                </time>
              </div>
              <h2 className="mt-3 font-display text-2xl font-semibold">{entry.title}</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted marker:text-tomato-text">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
      <p className="px-6 pb-24 text-center text-muted">
        Want the fine print? Every commit is on{" "}
        <a href={GITHUB_URL} className="font-bold text-ink underline hover:text-tomato-text">
          GitHub
        </a>
        .
      </p>
    </>
  );
}
