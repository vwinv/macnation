import type { Metadata } from "next";
import Link from "next/link";
import CatalogImage from "@/components/CatalogImage";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { getCatalogProducts } from "@/lib/api";
import { pageImages } from "@/lib/assets";
import { formatFcfa } from "@/lib/money";

export const metadata: Metadata = {
  title: "Boutique",
};

export const dynamic = "force-dynamic";

export default async function BoutiquePage() {
  const products = await getCatalogProducts();

  return (
    <main>
      <PageHero
        title="Boutique capillaire"
        subtitle="Payer par Wave, Orange Money ou Free Money. Tu récupères au salon, Nord Foire."
        image={pageImages.boutique}
      />
      <section className="mx-auto max-w-[1100px] px-6 pb-28">
        {products.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun produit en vente pour le moment.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <li key={p.id}>
                <Reveal delay={i * 0.04}>
                  <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-black/10">
                    <div className="relative aspect-square overflow-hidden bg-black">
                      <CatalogImage src={p.image} alt={p.name} sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 50vw" />
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      {p.category ? (
                        <p className="text-[11px] font-medium tracking-wide text-[#e0b12c]">{p.category}</p>
                      ) : null}
                      <h3 className="mt-0.5 font-bebas !font-medium text-lg leading-tight text-black sm:text-xl">{p.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">{p.description}</p>
                      <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-bebas !font-medium text-lg text-black">{formatFcfa(p.price)}</span>
                        <Link
                          href={`/boutique/payer/${p.id}`}
                          className="btn-black inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium"
                        >
                          Payer
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
