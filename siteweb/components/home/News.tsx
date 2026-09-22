import Image from "next/image";
import Link from "next/link";
import { articles } from "@/lib/data";
import Reveal from "@/components/Reveal";

export default function News() {
  const latest = articles.slice(0, 3);

  return (
    <section className="flex w-full items-center justify-center px-4 pt-2 pb-8 text-center sm:px-8 lg:px-[6vw]">
      <div className="bb-container w-full max-w-[1200px] pt-0 pb-4">
        <Reveal>
          <h2 className="mb-8 font-bebas text-5xl text-black">Dernières actualités</h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-sm text-gray-400">
            Le journal MAC NATION : actus du salon, conseils grooming et coulisses à Dakar.
          </p>
        </Reveal>
        <Reveal delay={0.12} className="flex flex-col items-center py-8">
          <Link
            href="/blog"
            className="btn-black flex cursor-pointer items-center gap-x-2 rounded-lg px-5 py-1.5 text-[14px] font-medium transition-colors"
          >
            Voir toutes les actualités
          </Link>
        </Reveal>
        <div className="grid w-full grid-cols-1 gap-12 md:grid-cols-3 md:gap-4">
          {latest.map((article, i) => (
            <Reveal key={article.slug} delay={0.08 * i}>
              <Link href={`/blog/${article.slug}`} className="group block text-left">
                <div className="rounded-[15px] p-[1px] stroke-gradient [--stroke-opacity:.2]">
                  <div className="relative min-h-[150px] w-full overflow-hidden rounded-[14px] md:aspect-[7/5]">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <div className="text-sm font-medium text-gray-400">{article.category}</div>
                  <div className="mt-1 line-clamp-1 font-bebas text-[2rem] leading-[1.2] text-black uppercase">
                    {article.title}
                  </div>
                  <time dateTime={article.dateIso} className="text-xs font-light text-gray-400/80 capitalize">
                    {article.date}
                  </time>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
