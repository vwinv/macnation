import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import { fetchPublicPlan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Payer un abonnement",
};

export default async function AbonnementPayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await fetchPublicPlan(id);
  if (!plan) notFound();

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <Link href="/abonnements" className="text-sm text-gray-500 hover:text-black">
        ← Abonnements
      </Link>
      <div className="mt-8">
        <CheckoutForm
          kind="abonnement"
          itemId={plan.id}
          title={plan.name}
          amount={plan.price}
          hint={`${plan.period}. Valable à Nord Foire. Les visites non utilisées ne se reportent pas.`}
        />
      </div>
    </main>
  );
}
