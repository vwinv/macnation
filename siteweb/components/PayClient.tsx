"use client";

import type { Invoice } from "@/lib/salon-types";
import { formatFcfa } from "@/lib/money";
import SoftPay from "@/components/SoftPay";

export default function PayClient({ invoice }: { invoice: Invoice }) {
  if (invoice.status === "payee") {
    return (
      <div className="rounded-2xl bg-gray-950 p-8 text-center stroke-gradient [--stroke-opacity:0.2]">
        <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
        <h1 className="font-bebas mt-3 text-5xl text-black">Payé</h1>
        <p className="mt-3 text-sm text-gray-400">
          {invoice.number} · {formatFcfa(invoice.amount)}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gray-950 p-8 stroke-gradient [--stroke-opacity:0.2]">
      <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION · NORD FOIRE</p>
      <h1 className="font-bebas mt-3 text-5xl text-black">Payer</h1>
      <p className="mt-2 text-sm text-gray-400">
        {invoice.number} · {invoice.clientName}
      </p>
      <ul className="mt-6 space-y-2 border-y border-black/10 py-5 text-sm">
        {invoice.items.map((line, index) => (
          <li key={`${line.name}-${index}`} className="flex justify-between gap-4 text-gray-600">
            <span>
              {line.name}
              {line.qty > 1 ? ` × ${line.qty}` : ""}
            </span>
            <span>{formatFcfa(line.qty * line.unitPrice)}</span>
          </li>
        ))}
        <li className="flex justify-between pt-2 text-black">
          <span>Total</span>
          <span className="font-bebas text-3xl">{formatFcfa(invoice.amount)}</span>
        </li>
      </ul>
      <div className="mt-6">
        <SoftPay
          invoiceId={invoice.id}
          amount={invoice.amount}
          name={invoice.clientName}
          phone={invoice.clientPhone}
          email={invoice.clientEmail}
          hideAmount
        />
      </div>
    </div>
  );
}
