import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <main>
      <article className="mx-auto max-w-[760px] px-6 pt-32 pb-16">
        <p className="text-sm text-gray-400">
          <Link href="/blog" className="hover:text-black">
            Blog
          </Link>{" "}
          / {article.category}
        </p>
        <h1 className="title1 mt-4 text-5xl md:text-6xl">{article.title}</h1>
        <time className="mt-4 block text-sm text-gray-500">{article.date}</time>
        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image src={article.image} alt={article.title} fill className="object-cover" sizes="760px" priority />
        </div>
        <div className="mt-10 space-y-5 text-[15px] leading-relaxed text-gray-600">
          <p>{article.excerpt}</p>
          <p>
            Chez MAC NATION, chaque geste s&apos;inscrit dans une culture commune : accueil, diagnostic, exigence.
            Nos barbers sont formés pour tous les types de cheveux, sans distinction, dans un salon pensé comme un
            second lieu de vie.
          </p>
          <p>
            Nord Foire, en face du service d&apos;hygiène. Un seul lieu pour le moment, pour que le standard reste
            le même à chaque chaise, chaque produit, chaque abonnement.
          </p>
        </div>
      </article>
      <section className="mx-auto max-w-[1100px] px-6 pb-24">
        <h2 className="font-bebas text-3xl">À lire aussi</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {others.map((a) => (
            <Link key={a.slug} href={`/blog/${a.slug}`} className="group">
              <div className="relative aspect-[7/5] overflow-hidden rounded-xl">
                <Image src={a.image} alt={a.title} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" sizes="30vw" />
              </div>
              <p className="mt-2 font-bebas text-xl uppercase">{a.title}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
