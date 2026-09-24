import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminInvoice } from "@/lib/api";
import { formatFcfa, methodLabel } from "@/lib/money";
import { salonInfo } from "@/lib/assets";
import OrderActions from "@/components/admin/OrderActions";

export const dynamic = "force-dynamic";

function dateLabel(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminInvoice(id);
  if (data === "unauthorized") redirect("/admin/login");
  if (!data || data.invoice.kind !== "boutique") notFound();
  const { invoice } = data;
  const paid = invoice.status === "payee";
  const delivered = Boolean(invoice.deliveredAt);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/commandes" className="text-sm text-gray-500 hover:text-black">
          ← Commandes
        </Link>
        <OrderActions invoice={invoice} />
      </div>

      <article className="rounded-2xl bg-white p-8 text-black print:hidden">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-6">
          <div>
            <p className="text-xs tracking-[0.22em] text-[#8a6d3d]">COMMANDE</p>
            <h1 className="font-bebas mt-1 text-5xl">{invoice.number}</h1>
            <p className="mt-2 text-sm text-black/60">{dateLabel(invoice.createdAt)}</p>
          </div>
          <div className="text-right text-sm">
            <p className={`font-medium ${paid ? "text-emerald-700" : invoice.status === "annulee" ? "text-red-500" : "text-black"}`}>
              {paid ? "PAYÉE" : invoice.status === "annulee" ? "ANNULÉE" : "À ENCAISSER"}
            </p>
            <p className="mt-1 text-black/60">{delivered ? `Livrée${invoice.deliveredAt ? ` · ${dateLabel(invoice.deliveredAt)}` : ""}` : "À livrer"}</p>
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
            <p className="text-black/45">Retrait</p>
            <p className="mt-1">{invoice.note || "Boutique · salon Nord Foire"}</p>
            {paid && invoice.paymentMethod ? <p>Réglé · {methodLabel(invoice.paymentMethod)}</p> : null}
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-black/45">
              <th className="py-2 font-medium">Produit</th>
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
          <div className="w-56 text-right">
            <p className="text-sm text-black/45">Total</p>
            <p className="font-bebas text-4xl">{formatFcfa(invoice.amount)}</p>
          </div>
        </div>
      </article>

      <article className="hidden print:block text-black">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-6">
          <div className="flex items-start gap-4">
            <Image src="/logo-square-dark.svg" alt="MAC NATION" width={72} height={72} className="h-16 w-16 shrink-0" />
            <div>
              <p className="text-xs tracking-[0.22em] text-[#8a6d3d]">MAC NATION</p>
              <h1 className="font-bebas mt-1 text-5xl">Reçu de paiement</h1>
              <p className="mt-2 text-sm text-black/60">
                {salonInfo.address}, {salonInfo.city}
                <br />
                {salonInfo.hours}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bebas text-3xl">{invoice.number}</p>
            <p className="mt-1 text-sm text-black/50">{dateLabel(invoice.paidAt || invoice.createdAt)}</p>
            <p className="mt-2 text-sm font-medium">PAYÉ</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-black/45">Client</p>
            <p className="mt-1 font-medium">{invoice.clientName}</p>
            {invoice.clientPhone ? <p>{invoice.clientPhone}</p> : null}
          </div>
          <div>
            <p className="text-black/45">Règlement</p>
            <p className="mt-1">{invoice.paymentMethod ? methodLabel(invoice.paymentMethod) : "Payé"}</p>
            <p>{invoice.note || "Boutique · salon Nord Foire"}</p>
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
              <tr key={`print-${line.name}-${index}`} className="border-b border-black/5">
                <td className="py-3">{line.name}</td>
                <td className="py-3 text-right">{line.qty}</td>
                <td className="py-3 text-right">{formatFcfa(line.unitPrice)}</td>
                <td className="py-3 text-right">{formatFcfa(line.qty * line.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-56 text-right">
            <p className="text-sm text-black/45">Montant réglé</p>
            <p className="font-bebas text-4xl">{formatFcfa(invoice.amount)}</p>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-black/45">Merci. MAC NATION · Nord Foire</p>
      </article>
    </main>
  );
}
