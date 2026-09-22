import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { people } from "@/lib/assets";

export default function OfferStrip() {
  return (
    <section className="w-full px-4 py-10 sm:px-8">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-5 lg:grid-cols-2">
        <Reveal>
          <Link href="/boutique" className="group relative block min-h-[320px] overflow-hidden rounded-2xl">
            <Image
              src={people.boutique}
              alt="Boutique capillaire MAC NATION"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-8">
              <h2 className="font-bebas text-5xl text-white">Boutique capillaire</h2>
              <p className="mt-2 max-w-[40ch] text-sm text-white/80">
                Payer par Wave, Orange Money ou Free. Retrait au salon Nord Foire.
              </p>
              <span className="btn-gold mt-5 inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium">
                Payer un produit
              </span>
            </div>
          </Link>
        </Reveal>
        <Reveal delay={0.08}>
          <Link href="/abonnements" className="group relative block min-h-[320px] overflow-hidden rounded-2xl">
            <Image
              src={people.waiting}
              alt="Abonnements MAC NATION"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-8">
              <h2 className="font-bebas text-5xl text-white">Abonnements</h2>
              <p className="mt-2 max-w-[42ch] text-sm text-white/80">
                Payer l&apos;abonnement en ligne. Wave, Orange Money ou Free Money.
              </p>
              <span className="btn-gold mt-5 inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium">
                Payer un abonnement
              </span>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
