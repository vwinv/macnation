import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import BookingForm from "@/components/BookingForm";
import { getSiteContent } from "@/lib/api";

export const metadata: Metadata = {
  title: "Prendre rendez-vous",
};

export const dynamic = "force-dynamic";

export default async function RendezVousPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const content = await getSiteContent();

  return (
    <main>
      <PageHero image={content.images.brandMosaic[0]} overlay="photo" />
      <section className="mx-auto max-w-[1100px] px-6 pb-28 pt-12 sm:pt-16">
        <h1 className="title1 mb-6 text-center text-4xl sm:mb-8 sm:text-5xl md:text-6xl">Prendre rendez-vous</h1>
        <p className="mx-auto mb-10 max-w-[60ch] text-center text-sm leading-relaxed text-gray-500 sm:mb-14 md:text-base">
          Choisissez le jour et l&apos;heure. Avec un abonnement, chaque rendez-vous utilise une visite du forfait encore disponible. Sinon paiement en ligne ou au salon.
        </p>
        <div className="mx-auto max-w-[720px]">
          <BookingForm initialServiceId={service} />
        </div>
      </section>
    </main>
  );
}
