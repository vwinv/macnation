import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import JoinCTA from "@/components/home/JoinCTA";
import { timeline } from "@/lib/data";
import { pageImages, people, photos } from "@/lib/assets";

export const metadata: Metadata = {
  title: "La marque MAC NATION - Grooming à Dakar",
};

const values = [
  {
    title: "Marbre et or",
    body: "Le lieu dicte le geste. Marbre noir, moulures blanches, touches d'or : un salon pensé pour durer, lisible de Nord Foire jusqu'au reste de Dakar.",
  },
  {
    title: "Un savoir-faire",
    body: "Accueil, diagnostic, geste. Un parcours client clair, du premier regard jusqu'au produit emporté.",
  },
  {
    title: "Un savoir-être",
    body: "Chacun se sent à sa place. L'équipe incarne la diversité dakaroise et ouvre le salon à toutes les textures.",
  },
];

const mosaic = [
  { src: people.reception, alt: "Accueil MAC NATION" },
  { src: photos.stations, alt: "Postes de coupe" },
  { src: people.waiting, alt: "Clients en attente" },
  { src: photos.boutiqueDesk, alt: "Boutique et accueil" },
];

export default function BrandPage() {
  return (
    <main>
      <PageHero
        kicker="MAC NATION born and raised in Dakar"
        title="Une vision dakaroise du grooming moderne."
        subtitle="Plus qu'une coupe, une nation. Un salon, une boutique, des abonnements. Tout au même endroit."
        image={pageImages.brand}
      />

      <section className="mx-auto grid max-w-[1200px] grid-cols-2 gap-3 px-6 pb-10 md:grid-cols-4">
        {mosaic.map((shot, i) => (
          <Reveal key={shot.src} delay={i * 0.05}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image src={shot.src} alt={shot.alt} fill className="object-cover" sizes="25vw" />
            </div>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-6 py-16 md:grid-cols-3">
        {values.map((v, i) => (
          <Reveal key={v.title} delay={i * 0.08} className="rounded-2xl bg-gray-950 p-8 stroke-gradient [--stroke-opacity:0.2]">
            <h2 className="font-bebas text-3xl text-black">{v.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">{v.body}</p>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto max-w-[800px] px-6 py-10 text-center">
        <Reveal>
          <h2 className="title1 text-5xl">Des valeurs</h2>
          <p className="mt-6 text-sm leading-relaxed text-gray-400">
            MAC NATION est plus qu&apos;un salon : c&apos;est une vision. La diversité forge le geste. Chaque
            culture, chaque génération contribue. Un espace où l&apos;effort est valorisé, à Dakar.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-6 py-16 md:grid-cols-2">
        <Reveal className="relative min-h-[280px] overflow-hidden rounded-2xl">
          <Image src={people.cut} alt="Le salon de Nord Foire" fill className="object-cover" sizes="50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 p-8">
            <h2 className="font-bebas text-4xl text-black">Un lieu unique</h2>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-gray-800">
              Pour le moment, un seul salon : Nord Foire, en face du service d&apos;hygiène. Toute l&apos;attention
              sur une adresse, une équipe, un standard.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.08} className="relative min-h-[280px] overflow-hidden rounded-2xl">
          <Image src={people.boutique} alt="Boutique capillaire" fill className="object-cover" sizes="50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 p-8">
            <h2 className="font-bebas text-4xl text-black">Salon, boutique, abonnement</h2>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-gray-800">
              La chaise, les produits, le rythme mensuel. On ne sépare pas la coupe de l&apos;entretien. C&apos;est
              le même univers, du rendez-vous jusqu&apos;au kit emporté.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[900px] px-6 py-16">
        <Reveal>
          <h2 className="title1 mb-10 text-center text-5xl">Notre histoire</h2>
        </Reveal>
        <ol className="relative space-y-10 border-l border-[#e0b12c]/30 pl-8">
          {timeline.map((item, i) => (
            <Reveal key={item.year} delay={i * 0.05}>
              <li>
                <span className="absolute -left-[7px] mt-1.5 size-3 rounded-full bg-[#e0b12c]" />
                <p className="font-bebas text-2xl text-black">{item.year}</p>
                <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-gray-400">{item.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <JoinCTA />
    </main>
  );
}
