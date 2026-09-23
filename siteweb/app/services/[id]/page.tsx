import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogImage from "@/components/CatalogImage";
import ProductReviews from "@/components/ProductReviews";
import ReserveLink from "@/components/ReserveLink";
import { getCatalogService, getCatalogServiceReviews } from "@/lib/api";
import { formatServicePrice, isQuotedService } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const service = await getCatalogService(id);
  return { title: service?.name || "Prestation" };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await getCatalogService(id);
  if (!service) notFound();
  const feedback = await getCatalogServiceReviews(id);
  const quoted = isQuotedService(service.price, service.priceLabel);

  return (
    <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-28">
      <Link href="/services" className="text-sm text-gray-500 hover:text-black">
        ← Catalogue
      </Link>
      <section className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
          <CatalogImage src={service.image} alt={service.name} sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
        <div>
          {service.category ? (
            <p className="text-xs font-medium tracking-wide text-[#e0b12c]">{service.category}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold text-black sm:text-4xl">{service.name}</h1>
          <p className="mt-4 text-2xl font-medium text-[#e0b12c]">
            {quoted ? "(Sur devis)" : formatServicePrice(service.price, service.priceLabel)}
          </p>
          {service.description ? (
            <p className="mt-5 text-sm leading-relaxed text-gray-500 md:text-base">{service.description}</p>
          ) : null}
          {service.duration ? <p className="mt-3 text-sm text-gray-500">{service.duration}</p> : null}
          <ReserveLink
            serviceId={service.id}
            className="btn-gold mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg text-sm font-medium sm:w-auto sm:px-8"
          >
            Réserver
          </ReserveLink>
        </div>
      </section>
      <ProductReviews
        serviceId={id}
        initialReviews={feedback.reviews}
        initialAverage={feedback.average}
        initialCount={feedback.count}
        initialMyRating={feedback.myRating}
      />
    </main>
  );
}
