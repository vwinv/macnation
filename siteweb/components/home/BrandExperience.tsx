import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { people, photos } from "@/lib/assets";

export default function BrandExperience() {
  return (
    <section className="relative w-full px-4 py-10 sm:px-8 lg:px-12 lg:py-12">
      <div className="bb-container relative overflow-hidden rounded-2xl bg-black p-4 sm:p-8 lg:p-14">
        <div className="relative z-10 flex flex-col items-center justify-center">
          <Reveal className="mb-10 flex flex-col items-center justify-center gap-y-5 text-center">
            <span className="rounded-[14px] border-[0.5px] border-[#e0b12c]/50 bg-transparent px-4 py-2 text-[1rem] font-medium text-white">
              Marque
            </span>
            <h2 className="font-bebas text-6xl font-bold uppercase leading-[1.05] text-white">
              Plus qu&apos;une simple coupe...
              <br /> une nation
            </h2>
          </Reveal>
          <Reveal className="grid w-full max-w-5xl grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-white/10">
              <Image
                src={photos.reception}
                alt="L'accueil MAC NATION"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 512px"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-white/10">
              <Image
                src={people.reception}
                alt="L'équipe à l'accueil"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 512px"
              />
            </div>
          </Reveal>
          <div className="mx-auto my-10 max-w-180">
            <p className="text-center text-md leading-relaxed font-medium text-white/70">
              <span className="font-semibold text-white">MAC NATION</span>, l&apos;art de lier la coiffure
              classique au barbering moderne, à Dakar. Une{" "}
              <span className="font-semibold text-white">expérience unique</span> portée par un{" "}
              <span className="font-semibold text-white">savoir-faire</span> et une exigence commune.
              <br />
              Notre promesse : la même qualité sur tous types de cheveux, en salon, en boutique et en abonnement.
            </p>
          </div>
          <Link
            href="/the-brand"
            className="btn-gold inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-medium"
          >
            En savoir plus sur nous
          </Link>
        </div>
      </div>
    </section>
  );
}
