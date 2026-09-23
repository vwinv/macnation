import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogImage from "@/components/CatalogImage";
import CheckoutForm from "@/components/CheckoutForm";
import { getCatalogProduct } from "@/lib/api";

export const metadata: Metadata = {
  title: "Payer un produit",
};

export const dynamic = "force-dynamic";

export default async function BoutiquePayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getCatalogProduct(id);
  if (!product) notFound();

  return (
    <main className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-6 pb-24 pt-28 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <Link href="/boutique" className="text-sm text-gray-500 hover:text-black">
          ← Boutique
        </Link>
        <div className="relative mt-5 aspect-square overflow-hidden rounded-2xl bg-black">
          <CatalogImage src={product.image} alt={product.name} sizes="480px" />
        </div>
        <p className="mt-4 text-sm text-gray-400">{product.description}</p>
        <p className="mt-2 text-sm text-gray-500">Retrait au salon, Nord Foire.</p>
      </div>
      <CheckoutForm
        kind="boutique"
        itemId={product.id}
        title={product.name}
        amount={product.price}
        showQty
        hint="Payer maintenant. On prépare le produit, tu le récupères au salon."
      />
    </main>
  );
}
