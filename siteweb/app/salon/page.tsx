import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock } from "@phosphor-icons/react/dist/ssr";
import PageHero from "@/components/PageHero";
import { salon } from "@/lib/data";
import { assets, people, photos } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Le salon - Nord Foire, Dakar",
};

export default function SalonPage() {
  return (
    <main>
      <PageHero
        title="MAC NATION Nord Foire"
        subtitle="Le premier salon. Le seul, pour le moment. Dakar, en face du service d'hygiène."
        image={photos.fullSalonAlt}
      />

      <section className="mx-auto max-w-[1100px] px-6 pb-10">
        <div className="relative aspect-[16/8] min-h-[240px] overflow-hidden rounded-2xl">
          <Image src={assets.salon} alt={salon.name} fill priority className="object-cover" sizes="1100px" />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="max-w-[65ch] text-sm leading-relaxed text-gray-400">
            Marbre noir, moulures blanches, or sur les consoles. Nos barbers maîtrisent fades, barbe et coupes
            pour tous les types de cheveux. Lavabo, soins, boutique capillaire sur place. Abonnements pour ceux
            qui veulent un rythme, pas une surprise.
          </p>
          <Link
            href="/rendez-vous"
            className="btn-gold mt-8 inline-flex h-11 cursor-pointer items-center rounded-lg px-8 text-sm transition-all"
          >
            Réserver
          </Link>
        </div>
        <aside className="rounded-2xl bg-gray-950 p-6 stroke-gradient [--stroke-opacity:0.2]">
          <p className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin size={18} className="mt-0.5 shrink-0" />
            {salon.address}
            <br />
            {salon.city}, {salon.country}
          </p>
          <p className="mt-4 flex items-start gap-2 text-sm text-gray-400">
            <Clock size={18} className="mt-0.5 shrink-0" />
            {salon.hours}
          </p>
        </aside>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <h2 className="font-bebas text-4xl text-black">Le lieu</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {assets.gallery.map((src, i) => (
            <div
              key={src}
              className={`relative overflow-hidden rounded-xl ${i === 0 || i === 5 ? "md:col-span-2 md:aspect-[16/8]" : "aspect-[4/3]"}`}
            >
              <Image
                src={src}
                alt={`MAC NATION Nord Foire, vue ${i + 1}`}
                fill
                className="object-cover"
                sizes={i === 0 || i === 5 ? "80vw" : "40vw"}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
            <Image src={people.cut} alt="Coupe en station" fill className="object-cover" sizes="50vw" />
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
            <Image src={people.boutique} alt="Boutique capillaire" fill className="object-cover" sizes="50vw" />
          </div>
        </div>
      </section>
    </main>
  );
}
