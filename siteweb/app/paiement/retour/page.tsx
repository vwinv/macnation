import Link from "next/link";
import { getPublicInvoice, settlePaytech, settlePaytechPending } from "@/lib/api";
import { formatFcfa } from "@/lib/money";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function PaiementRetourPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const invoiceId = first(sp.invoice);
  const pendingId = first(sp.pending);
  let invoice = invoiceId ? await getPublicInvoice(invoiceId) : null;
  let paid = invoice?.status === "payee";

  if (pendingId && !paid) {
    const pending = await settlePaytechPending(pendingId);
    paid = pending.paid;
    if (pending.invoiceId) {
      invoice = (await getPublicInvoice(pending.invoiceId)) || invoice;
      paid = invoice?.status === "payee" || paid;
    }
  }

  if (invoice && invoice.status !== "payee") {
    try {
      await settlePaytech(invoice.id);
      invoice = (await getPublicInvoice(invoice.id)) || invoice;
      paid = invoice.status === "payee";
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-12 text-center">
      <div className="w-full max-w-md rounded-2xl bg-gray-950 p-8 stroke-gradient [--stroke-opacity:0.2]">
        <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
        <h1 className="font-bebas mt-3 text-5xl text-black">{paid ? "Paiement reçu" : "Paiement en cours"}</h1>
        <p className="mt-3 text-sm text-gray-400">
          {paid
            ? `${invoice?.number || "Commande"} · ${formatFcfa(invoice?.amount || 0)}. Merci, à tout à l’heure au salon.`
            : "Si tu as validé sur ton téléphone, la commande s’enregistre dès confirmation. Tu peux fermer cette page."}
        </p>
        <Link href="/" className="btn-gold mt-8 inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-medium">
          Retour au site
        </Link>
      </div>
    </main>
  );
}
