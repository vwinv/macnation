import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicInvoice } from "@/lib/api";
import PayClient from "@/components/PayClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paiement",
  robots: { index: false, follow: false },
};

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getPublicInvoice(id);
  if (!invoice || invoice.status === "annulee") notFound();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-12">
      <div className="w-full max-w-md">
        <PayClient invoice={invoice} />
      </div>
    </main>
  );
}
