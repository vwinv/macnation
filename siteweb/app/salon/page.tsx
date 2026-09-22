import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowSquareOut, Clock, MapPin } from "@phosphor-icons/react/dist/ssr";
import PageHero from "@/components/PageHero";
import { salon } from "@/lib/data";
import { assets } from "@/lib/assets";

function mapsUrls(query: string) {
  const q = encodeURIComponent(query);
  return {
    open: `https://www.google.com/maps/search/?api=1&query=${q}`,
    embed: `https://maps.google.com/maps?q=${q}&z=16&output=embed`,
  };
}

const mosaicTiles = [
  "col-span-12 min-h-[220px] sm:min-h-[280px] md:col-span-8 md:min-h-[380px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[380px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[280px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[280px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[280px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-5 md:min-h-[320px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-7 md:min-h-[320px]",
  "col-span-12 min-h-[200px] sm:min-h-[240px] md:col-span-6 md:min-h-[300px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-6 md:min-h-[300px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[260px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[260px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[260px]",
];

export const metadata: Metadata = {
  title: "Le salon - Nord Foire, Dakar",
};

export default function SalonPage() {
  const maps = mapsUrls(salon.mapsQuery);

  return (
    <main>
      <PageHero
        title="MAC NATION Nord Foire"
        subtitle="Le premier salon. Le seul, pour le moment. Dakar, en face du service d'hygiène."
        plain
      />

      <section className="mx-auto w-full max-w-[1200px] px-6 pb-10">
        <div className="relative aspect-[16/10] w-full min-w-0 overflow-hidden rounded-2xl sm:aspect-[16/9] md:aspect-[16/8]">
          <Image src={assets.salon} alt={salon.name} fill priority className="object-cover" sizes="100vw" />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[1.4fr_0.8fr]">
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

      <section className="mx-auto max-w-[1200px] px-6 pb-16">
        <div className="overflow-hidden rounded-2xl bg-gray-950 ring-1 ring-black/10">
          <iframe
            title="Carte MAC NATION Nord Foire"
            src={maps.embed}
            className="h-72 w-full border-0 sm:h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <p className="text-sm text-black">
              {salon.address}, {salon.city}
            </p>
            <a
              href={maps.open}
              target="_blank"
              rel="noreferrer"
              className="btn-gold inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium"
            >
              Ouvrir dans Google Maps
              <ArrowSquareOut size={16} />
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <h2 className="font-bebas text-4xl text-black">Le lieu</h2>
        <div className="mt-6 grid grid-cols-12 gap-2">
          {assets.gallery.map((src, i) => (
            <div key={`${src}-${i}`} className={`${mosaicTiles[i] ?? "col-span-6 min-h-[220px] md:col-span-4"} h-full`}>
              <div className="relative h-full min-h-[inherit] overflow-hidden rounded-xl">
                <Image
                  src={src}
                  alt={`MAC NATION Nord Foire, vue ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
