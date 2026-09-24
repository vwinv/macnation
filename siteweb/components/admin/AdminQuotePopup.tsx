"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash, X } from "@phosphor-icons/react";
import type { Booking } from "@/lib/salon-types";
import { DOMICILE_FEE, formatFcfa, invoiceTotal, type InvoiceLine } from "@/lib/money";

type DraftLine = {
  id: string;
  name: string;
  qty: string;
  price: string;
  locked?: boolean;
};

type DiscountKind = "none" | "amount" | "percent";

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseMoney(value: string) {
  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function initialLines(booking: Booking): DraftLine[] {
  const lines: DraftLine[] = [
    { id: "service", name: booking.serviceName, qty: "1", price: "", locked: true },
  ];
  if (booking.place === "domicile") {
    lines.push({
      id: "domicile",
      name: "Déplacement domicile",
      qty: "1",
      price: String(DOMICILE_FEE),
      locked: true,
    });
  }
  return lines;
}

function toLines(rows: DraftLine[]): InvoiceLine[] {
  return rows
    .map((row) => ({
      name: row.name.trim(),
      qty: Math.max(1, Math.round(parseMoney(row.qty) || 1)),
      unitPrice: Math.round(parseMoney(row.price)),
    }))
    .filter((line) => line.name);
}

export default function AdminQuotePopup({
  booking,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  booking: Booking;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (items: InvoiceLine[]) => void;
}) {
  const [lines, setLines] = useState(() => initialLines(booking));
  const [discountKind, setDiscountKind] = useState<DiscountKind>("none");
  const [discountValue, setDiscountValue] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const priced = useMemo(() => toLines(lines), [lines]);
  const subtotal = invoiceTotal(priced);
  const rawDiscount = Math.max(0, parseMoney(discountValue));
  const discount =
    discountKind === "percent"
      ? Math.min(subtotal, Math.round((subtotal * rawDiscount) / 100))
      : discountKind === "amount"
        ? Math.min(subtotal, Math.round(rawDiscount))
        : 0;
  const total = Math.max(0, subtotal - discount);

  function updateLine(id: string, patch: Partial<DraftLine>) {
    setLines((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addLine() {
    setLines((current) => [...current, { id: newId(), name: "", qty: "1", price: "" }]);
  }

  function removeLine(id: string) {
    setLines((current) => current.filter((row) => row.id !== id || row.locked));
  }

  function submit() {
    const items = [...priced];
    if (discount > 0) {
      const label = discountKind === "percent" ? `Réduction ${rawDiscount} %` : "Réduction";
      items.push({ name: label, qty: 1, unitPrice: -discount });
    }
    onSubmit(items);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-quote-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-[#e0b12c]">DEVIS</p>
            <h2 id="admin-quote-title" className="font-bebas mt-2 text-4xl text-black">
              Faire le devis
            </h2>
            <p className="mt-1 text-sm capitalize text-gray-500">
              {booking.name} · {booking.dateLabel} · {booking.time}
            </p>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-gray-900 text-black hover:bg-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {lines.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_5.5rem_auto] items-end gap-2">
              <label className="flex flex-col gap-1 text-sm text-black">
                {row.id === "service" ? "Prestation" : row.id === "domicile" ? "Domicile" : "Ligne"}
                <input
                  value={row.name}
                  readOnly={row.locked}
                  onChange={(e) => updateLine(row.id, { name: e.target.value })}
                  className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50 read-only:text-gray-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-black">
                Prix
                <input
                  value={row.price}
                  onChange={(e) => updateLine(row.id, { price: e.target.value })}
                  inputMode="numeric"
                  placeholder="F"
                  className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
                />
              </label>
              {row.locked ? (
                <span className="mb-2 h-7 w-7" />
              ) : (
                <button
                  type="button"
                  aria-label="Retirer la ligne"
                  onClick={() => removeLine(row.id)}
                  className="mb-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLine}
          className="mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm text-black hover:bg-gray-900"
        >
          <Plus size={14} />
          Ajouter une ligne
        </button>

        <div className="mt-5 rounded-xl bg-gray-900 p-4 ring-1 ring-black/10">
          <p className="text-sm font-medium text-black">Réduction</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(
              [
                { id: "none", label: "Aucune" },
                { id: "amount", label: "Montant" },
                { id: "percent", label: "%" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDiscountKind(opt.id)}
                className={`h-10 cursor-pointer rounded-lg text-sm ${
                  discountKind === opt.id ? "btn-black" : "bg-white text-gray-600 ring-1 ring-black/10 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {discountKind !== "none" ? (
            <input
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              inputMode="numeric"
              placeholder={discountKind === "percent" ? "Ex. 10" : "Ex. 2000"}
              className="mt-3 h-11 w-full rounded-lg bg-white px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
            />
          ) : null}
        </div>

        <div className="mt-5 space-y-1 text-sm">
          <p className="flex justify-between text-gray-500">
            <span>Sous-total</span>
            <span>{formatFcfa(subtotal)}</span>
          </p>
          {discount > 0 ? (
            <p className="flex justify-between text-gray-500">
              <span>Réduction</span>
              <span>− {formatFcfa(discount)}</span>
            </p>
          ) : null}
          <p className="flex justify-between font-medium text-black">
            <span>Total à payer</span>
            <span>{formatFcfa(total)}</span>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            C’est ce total que le client paie, et le montant qui figure sur sa facture.
          </p>
        </div>

        {error ? <p className="mt-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}

        <button
          type="button"
          disabled={busy || total <= 0}
          onClick={submit}
          className="btn-gold mt-6 h-11 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Envoi…" : "Envoyer le devis"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
