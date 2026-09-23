import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetailActions from "@/components/ProductDetailActions";
import ProductGallery from "@/components/ProductGallery";
import ProductReviews from "@/components/ProductReviews";
import { getCatalogProduct, getCatalogProductReviews } from "@/lib/api";
import { formatFcfa } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getCatalogProduct(id);
  return { title: product?.name || "Produit" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getCatalogProduct(id);
  if (!product) notFound();
  const feedback = await getCatalogProductReviews(id);

  return (
    <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-28">
      <Link href="/boutique" className="text-sm text-gray-500 hover:text-black">
        ← Boutique
      </Link>
      <section className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
        <ProductGallery name={product.name} images={product.images?.length ? product.images : [product.image]} />
        <div>
          {product.category ? (
            <p className="text-xs font-medium tracking-wide text-[#e0b12c]">{product.category}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold text-black sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-2xl font-medium text-[#e0b12c]">{formatFcfa(product.price)}</p>
          <p className="mt-5 text-sm leading-relaxed text-gray-500 md:text-base">{product.description}</p>
          <p className="mt-3 text-sm text-gray-500">Retrait au salon, Nord Foire.</p>
          <ProductDetailActions
            product={{ id: product.id, name: product.name, price: product.price, image: product.image }}
          />
        </div>
      </section>
      <ProductReviews
        productId={id}
        initialReviews={feedback.reviews}
        initialAverage={feedback.average}
        initialCount={feedback.count}
        initialMyRating={feedback.myRating}
      />
    </main>
  );
}
