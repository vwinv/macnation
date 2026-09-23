"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { pageImages } from "@/lib/assets";
import { articles } from "@/lib/data";

const cats = ["Toutes", "Lifestyle", "Guides et Conseils", "Nos actus", "Tendance"] as const;

export default function BlogPage() {
  const [cat, setCat] = useState<(typeof cats)[number]>("Toutes");
  const list = useMemo(
    () => (cat === "Toutes" ? articles : articles.filter((a) => a.category === cat)),
    [cat],
  );
  const featured = list[0];
  const rest = list.slice(1);

  return (
    <main>
      <PageHero
        title={
          <>
            Dernières <span className="!text-[#e0b12c]">actualités</span>
          </>
        }
        image={pageImages.blog}
        overlay="blur"
      />
      <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-12 sm:pt-16">
        <p className="mx-auto mb-16 max-w-[60ch] text-center text-sm leading-relaxed text-black sm:mb-20 md:mb-24 md:text-base">
          Actus du salon, conseils grooming et coulisses à Dakar.
        </p>
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm ${
                cat === c ? "bg-white text-gray-950" : "bg-gray-900 text-gray-600 hover:bg-gray-800"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">Aucun article dans cette catégorie pour le moment.</p>
        ) : (
          <>
            {featured ? (
              <Link href={`/blog/${featured.slug}`} className="group mb-12 grid grid-cols-1 overflow-hidden rounded-2xl bg-gray-950 stroke-gradient [--stroke-opacity:0.18] lg:grid-cols-2">
                <div className="relative min-h-[240px] aspect-[16/10]">
                  <Image src={featured.image} alt={featured.title} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" sizes="50vw" />
                </div>
                <div className="flex flex-col justify-center p-8 text-left">
                  <p className="text-sm text-gray-400">
                    {featured.category} · {featured.date}
                  </p>
                  <h2 className="mt-3 font-bebas text-4xl text-black uppercase">{featured.title}</h2>
                  <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-gray-400">{featured.excerpt}</p>
                  <span className="mt-6 text-sm text-gray-800">Voir l&apos;article</span>
                </div>
              </Link>
            ) : null}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {rest.map((article) => (
                <Link key={article.slug} href={`/blog/${article.slug}`} className="group block">
                  <div className="overflow-hidden rounded-[15px] p-[1px] stroke-gradient [--stroke-opacity:.2]">
                    <div className="relative aspect-[7/5] overflow-hidden rounded-[14px]">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="30vw"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-400">{article.category}</p>
                  <h3 className="mt-1 line-clamp-2 font-bebas text-[1.7rem] leading-[1.15] uppercase">{article.title}</h3>
                  <time className="text-xs text-gray-500">{article.date}</time>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
