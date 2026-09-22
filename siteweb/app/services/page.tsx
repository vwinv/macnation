import type { Metadata } from "next";
import Link from "next/link";
import CatalogImage from "@/components/CatalogImage";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { getCatalogServices } from "@/lib/api";
import { pageImages } from "@/lib/assets";
import { formatServicePrice } from "@/lib/money";

export const metadata: Metadata = {
  title: "Catalogue",
};

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getCatalogServices();

  return (
    <main>
      <PageHero
        title="Catalogue - Coupe, Barbe, Enfants"
        image={pageImages.services}
        overlay="photo"
      />
      <section className="mx-auto max-w-[1100px] px-6 pb-28 pt-12 sm:pt-16">
        <p className="mx-auto mb-10 max-w-[60ch] text-center text-sm leading-relaxed text-gray-500 sm:mb-14 md:text-base">
          Prestations au salon de Nord Foire, ou à domicile. Hommes, ados et enfants. Tarifs en francs CFA.
        </p>
        {services.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune prestation pour le moment.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {services.map((s, i) => (
              <li key={s.id}>
                <Reveal delay={i * 0.04}>
                  <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-black/10">
                    <div className="relative aspect-square overflow-hidden bg-black">
                      <CatalogImage src={s.image} alt={s.name} sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 50vw" />
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      {s.category ? (
                        <p className="text-[11px] font-medium tracking-wide text-[#e0b12c]">{s.category}</p>
                      ) : null}
                      <h2 className="mt-0.5 font-bebas !font-medium text-lg leading-tight text-black sm:text-xl">{s.name}</h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">{s.description}</p>
                      {s.duration ? <p className="mt-1 text-[11px] text-gray-500">{s.duration}</p> : null}
                      <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-bebas !font-medium text-lg text-black">{formatServicePrice(s.price, s.priceLabel)}</span>
                        <Link
                          href={`/rendez-vous?service=${encodeURIComponent(s.id)}`}
                          className="btn-black inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium"
                        >
                          Réserver
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
