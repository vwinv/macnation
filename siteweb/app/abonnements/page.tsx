import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { pageImages, people, photos } from "@/lib/assets";
import { formatFcfa } from "@/lib/money";
import { fetchPublicPlans } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Abonnements",
};

export default async function AbonnementsPage() {
  const plans = await fetchPublicPlans();

  return (
    <main>
      <PageHero
        kicker="Wave · Orange Money · Free Money"
        title="Abonnements"
        subtitle="Payer en ligne par Wave, Orange Money ou Free Money. Valable uniquement à Nord Foire."
        image={pageImages.abonnements}
      />
      <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 px-6 pb-12 md:grid-cols-3">
        {plans.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun abonnement pour le moment.</p>
        ) : (
          plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.06}>
              <article
                className={`flex h-full flex-col rounded-2xl p-7 stroke-gradient [--stroke-opacity:0.2] ${
                  plan.featured ? "bg-gray-900" : "bg-gray-950"
                }`}
              >
                {plan.featured ? (
                  <p className="mb-3 text-xs font-medium text-[#e0b12c]">Le plus choisi</p>
                ) : (
                  <div className="mb-3 h-4" />
                )}
                <h2 className="font-bebas text-4xl text-black">{plan.name}</h2>
                <p className="mt-4 font-bebas text-5xl text-black">{formatFcfa(plan.price)}</p>
                <p className="text-sm text-gray-500">{plan.period}</p>
                <ul className="mt-8 flex-1 space-y-3 text-sm text-gray-600">
                  {plan.perks.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <Link
                  href={`/abonnements/payer/${plan.id}`}
                  className="btn-gold mt-8 inline-flex h-12 items-center justify-center rounded-lg text-sm font-medium"
                >
                  Payer par Wave / Orange / Free
                </Link>
              </article>
            </Reveal>
          ))
        )}
      </section>
      <section className="mx-auto mb-10 max-w-[1100px] px-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { src: people.waiting, alt: "Clients en attente" },
            { src: photos.lounge, alt: "Lounge" },
            { src: people.cut, alt: "Coupe en salon" },
          ].map((shot) => (
            <div key={shot.src} className="relative aspect-[16/10] overflow-hidden rounded-xl">
              <Image src={shot.src} alt={shot.alt} fill className="object-cover" sizes="33vw" />
            </div>
          ))}
        </div>
      </section>
      <p className="mx-auto max-w-[60ch] px-6 pb-24 text-center text-sm text-gray-500">
        L&apos;abonnement démarre dès le paiement. Si tu n&apos;as pas encore de compte, on le crée : connecte-toi ensuite pour le confirmer. Les visites non utilisées ne se reportent pas au mois suivant.
      </p>
    </main>
  );
}
