import CatalogImage from "@/components/CatalogImage";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Reveal from "@/components/Reveal";
import { people } from "@/lib/assets";
import type { SiteCtaItem } from "@/lib/site-content";

const DEFAULT_ITEMS: SiteCtaItem[] = [
  { href: "/rendez-vous", kicker: "En tant que client", title: "Prendre rendez-vous", dark: false },
  { href: "/abonnements", kicker: "En tant que membre", title: "Prendre un abonnement", dark: true },
];

export default function JoinCTA({
  title = "L'histoire s'écrit à Dakar",
  items = DEFAULT_ITEMS,
  image = people.waiting,
}: {
  title?: string;
  items?: SiteCtaItem[];
  image?: string;
}) {
  return (
    <section className="relative w-full overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <CatalogImage src={image} alt="" className="object-cover opacity-25" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
      </div>
      <div className="relative z-10">
        <Reveal>
          <h3 className="title1 mb-2 text-center text-4xl md:text-5xl">{title}</h3>
        </Reveal>
        <div className="flex w-full flex-col items-center justify-center gap-4 px-4 py-4 sm:px-8 lg:flex-row lg:px-16 lg:py-8">
          {items.filter((item) => !/equipe|career/i.test(item.href)).map((item, i) => (
            <Reveal key={item.href} delay={i * 0.08} className="w-full sm:w-auto">
              <div className="flex w-full flex-col items-center justify-center rounded-3xl p-2">
                <Link
                  href={item.href}
                  className={`group flex h-35 w-full items-center justify-between gap-y-4 rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] sm:w-100 lg:h-30 lg:w-[25vw] ${
                    item.dark ? "bg-black text-white" : "bg-[#e0b12c] text-black"
                  }`}
                >
                  <div className="mr-1 flex flex-col justify-center gap-y-1 sm:mr-6">
                    <span className={`line-clamp-2 text-md font-semibold ${item.dark ? "text-white/70" : "text-black/70"}`}>
                      {item.kicker}
                    </span>
                    <b className={`line-clamp-2 text-xl font-bold ${item.dark ? "text-white" : "text-black"}`}>
                      {item.title}
                    </b>
                  </div>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1 ${
                      item.dark ? "bg-[#e0b12c]" : "bg-black"
                    }`}
                  >
                    <ArrowRight size={16} className={item.dark ? "text-black" : "text-[#e0b12c]"} />
                  </span>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
