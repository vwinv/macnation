import Image from "next/image";
import Reveal from "@/components/Reveal";
import ApplyForm from "@/components/ApplyForm";
import { people } from "@/lib/assets";

export default function JoinTeam() {
  return (
    <section id="equipe" className="w-full scroll-mt-28 px-4 py-10 sm:px-8">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
          <h2 className="title1 mt-3 text-5xl md:text-6xl">Rejoindre notre équipe</h2>
          <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-gray-400 md:text-base">
            Barber, accueil ou candidature spontanée. Envoie ton CV : on lit chaque dossier à Nord Foire.
          </p>
          <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-2xl">
            <Image
              src={people.barber}
              alt="Équipe MAC NATION au salon de Nord Foire"
              fill
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="rounded-2xl bg-black p-6 sm:p-8">
            <p className="text-xs tracking-[0.18em] text-[#e0b12c]">CANDIDATURE</p>
            <h3 className="font-bebas mt-2 text-3xl text-white">Postuler</h3>
            <ApplyForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
