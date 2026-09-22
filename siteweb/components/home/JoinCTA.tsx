import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Reveal from "@/components/Reveal";
import { people } from "@/lib/assets";

const items = [
  { href: "/#equipe", kicker: "En tant que barber", title: "Rejoindre l'équipe" },
  { href: "/rendez-vous", kicker: "En tant que client", title: "Prendre rendez-vous" },
  { href: "/abonnements", kicker: "En tant que membre", title: "Prendre un abonnement" },
];

export default function JoinCTA() {
  return (
    <section className="relative w-full overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <Image src={people.waiting} alt="" fill className="object-cover opacity-25" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
      </div>
      <div className="relative z-10">
        <Reveal>
          <h3 className="title1 mb-2 text-center text-4xl md:text-5xl">L&apos;histoire s&apos;écrit à Dakar</h3>
        </Reveal>
        <div className="flex w-full flex-col items-center justify-center gap-4 px-4 py-4 sm:px-8 lg:flex-row lg:px-16 lg:py-8">
          {items.map((item, i) => (
            <Reveal key={item.href} delay={i * 0.08} className="w-full sm:w-auto">
              <div className="flex w-full flex-col items-center justify-center rounded-3xl p-2">
                <Link
                  href={item.href}
                  className="flex h-35 w-full items-center justify-between gap-y-4 rounded-2xl bg-[#e0b12c] p-6 text-black transition-all duration-300 hover:bg-[#f0c43a] sm:w-100 lg:h-30 lg:w-[25vw]"
                >
                  <div className="mr-1 flex flex-col justify-center gap-y-1 sm:mr-6">
                    <span className="line-clamp-2 text-md font-semibold text-black/70">{item.kicker}</span>
                    <b className="line-clamp-2 text-xl font-bold text-black">{item.title}</b>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black">
                    <ArrowRight size={16} className="text-[#e0b12c]" />
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
