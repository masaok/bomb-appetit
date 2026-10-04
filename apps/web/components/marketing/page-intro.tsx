import type { ReactNode } from "react";

/** Title block for the top of an inner marketing page. */
export function PageIntro({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-10 pb-4 text-center lg:pt-16">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-tomato">
        {kicker}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-balance sm:text-6xl">
        {title}
      </h1>
      {children ? (
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted sm:text-xl">
          {children}
        </p>
      ) : null}
    </div>
  );
}
