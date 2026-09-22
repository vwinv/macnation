import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminInvoice } from "@/lib/api";
import { formatFcfa, methodLabel } from "@/lib/money";
import { salonInfo } from "@/lib/assets";
import { PrintButton } from "@/components/admin/AdminNav";
import InvoiceActions from "@/components/admin/InvoiceActions";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminInvoice(id);
  if (data === "unauthorized") redirect("/admin/login");
  if (!data) notFound();
  const { invoice, booking } = data;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/factures" className="text-sm text-gray-500 hover:text-black">
          ← Factures
        </Link>
        <div className="flex gap-2">
          <PrintButton />
          <InvoiceActions invoice={invoice} />
        </div>
      </div>

      <article className="rounded-2xl bg-white p-8 text-black print:rounded-none print:p-0">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-6">
          <div className="flex items-start gap-4">
            <Image
              src="/logo-square-dark.svg"
              alt="MAC NATION"
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 sm:h-[72px] sm:w-[72px]"
              priority
            />
            <div>
              <p className="text-xs tracking-[0.22em] text-[#8a6d3d]">MAC NATION</p>
              <h1 className="font-bebas mt-1 text-5xl">Facture</h1>
              <p className="mt-2 text-sm text-black/60">
                {salonInfo.address}, {salonInfo.city}
                <br />
                {salonInfo.hours}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bebas text-3xl">{invoice.number}</p>
            <p className="mt-1 text-sm text-black/50">{new Date(invoice.createdAt).toLocaleDateString("fr-FR")}</p>
            <p className="mt-2 text-sm font-medium">{invoice.status === "payee" ? "PAYÉE" : invoice.status === "annulee" ? "ANNULÉE" : "À PAYER"}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-black/45">Client</p>
            <p className="mt-1 font-medium">{invoice.clientName}</p>
            {invoice.clientPhone ? <p>{invoice.clientPhone}</p> : null}
            {invoice.clientEmail ? <p>{invoice.clientEmail}</p> : null}
          </div>
          <div>
            <p className="text-black/45">
              {invoice.kind === "boutique"
                ? "Produit"
                : invoice.kind === "abonnement"
                  ? "Abonnement"
                  : "Prestation"}
            </p>
            <p className="mt-1">{booking ? `${booking.dateLabel} · ${booking.time}` : invoice.note || "Passage caisse"}</p>
            {booking ? <p>{booking.place === "domicile" ? `Domicile · ${booking.address}` : "Salon Nord Foire"}</p> : null}
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-black/45">
              <th className="py-2 font-medium">Désignation</th>
              <th className="py-2 text-right font-medium">Qté</th>
              <th className="py-2 text-right font-medium">P.U.</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((line, index) => (
              <tr key={`${line.name}-${index}`} className="border-b border-black/5">
                <td className="py-3">{line.name}</td>
                <td className="py-3 text-right">{line.qty}</td>
                <td className="py-3 text-right">{formatFcfa(line.unitPrice)}</td>
                <td className="py-3 text-right">{formatFcfa(line.qty * line.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-56">
            <div className="flex justify-between text-sm">
              <span className="text-black/45">Total</span>
              <span className="font-bebas text-3xl">{formatFcfa(invoice.amount)}</span>
            </div>
            {invoice.status === "payee" ? (
              <p className="mt-2 text-right text-sm text-emerald-700">
                Réglé{invoice.paymentMethod ? ` · ${methodLabel(invoice.paymentMethod)}` : ""}
                {invoice.paidAt ? ` · ${new Date(invoice.paidAt).toLocaleDateString("fr-FR")}` : ""}
              </p>
            ) : (
              <p className="mt-2 text-right text-sm text-black/50">Wave · Orange Money · Free Money · Espèces</p>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
