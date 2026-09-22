import type { ReactNode } from "react";
import PageHero from "@/components/PageHero";

export default function LegalArticle({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main>
      <PageHero title={title} subtitle={subtitle} />
      <article className="legal mx-auto max-w-[720px] space-y-5 px-6 pb-28 text-sm leading-relaxed text-gray-400">
        {children}
        <p className="pt-4 text-xs text-gray-600">Dernière mise à jour : 18 août 2026. MAC NATION, Nord Foire, Dakar.</p>
      </article>
    </main>
  );
}
