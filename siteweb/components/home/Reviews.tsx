"use client";

import Reveal from "@/components/Reveal";
import type { SiteReview } from "@/lib/site-content";

function Card({ name, text, city, rating }: { name: string; text: string; city: string; rating: string }) {
  return (
    <article className="flex w-[min(86vw,320px)] shrink-0 flex-col justify-between rounded-xl bg-black p-6 md:w-[340px]">
      <p className="text-sm leading-relaxed text-white/70">{text}</p>
      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="mt-0.5 text-xs text-white/50">{city}</p>
        </div>
        <p className="shrink-0 text-xs tracking-wide text-[#e0b12c]">{rating}</p>
      </div>
    </article>
  );
}

export default function Reviews({
  title = "Une expérience saluée par nos clients",
  subtitle = "Les premiers retours",
  items = [],
}: {
  title?: string;
  subtitle?: string;
  items?: SiteReview[];
}) {
  const loop = items.length ? [...items, ...items] : [];

  return (
    <section className="w-full py-10 md:py-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <Reveal>
          <header className="mx-auto max-w-[36rem] text-center">
            <h2 className="title1 text-4xl sm:text-5xl md:text-6xl">{title}</h2>
            <p className="mt-4 text-sm text-gray-400 md:text-base">{subtitle}</p>
          </header>
        </Reveal>
      </div>

      <div className="relative mt-8 overflow-hidden md:mt-10">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent sm:w-24" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent sm:w-24" />
        <div className="marquee-track flex w-max gap-4 px-4">
          {loop.map((r, i) => (
            <Card key={`${r.author}-${i}`} name={r.author} text={r.quote} city={r.city} rating={r.rating} />
          ))}
        </div>
      </div>
    </section>
  );
}
