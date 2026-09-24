"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import type { Booking, Invoice } from "@/lib/salon-types";
import { formatFcfa, invoiceTotal } from "@/lib/money";

function useLockBody(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);
}

function Shell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-popup-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
            <h2 id="quote-popup-title" className="font-bebas mt-2 text-4xl text-black">
              {title}
            </h2>
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
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function QuoteViewPopup({
  open,
  booking,
  invoice,
  onClose,
}: {
  open: boolean;
  booking: Booking | null;
  invoice?: Invoice;
  onClose: () => void;
}) {
  useLockBody(open, onClose);
  if (!open || !booking) return null;
  if (booking.amount <= 0) {
    return (
      <Shell title="Devis" onClose={onClose}>
        <p className="mt-5 text-sm font-medium text-black">Devis pas encore disponible.</p>
        <p className="mt-2 text-sm text-gray-500">Le salon prépare le tarif. Tu le recevras par mail dès qu’il sera prêt.</p>
        <button type="button" onClick={onClose} className="btn-black mt-6 h-11 w-full cursor-pointer rounded-lg text-sm font-medium">
          Fermer
        </button>
      </Shell>
    );
  }
  const lines = invoice?.items?.length ? invoice.items : [{ name: booking.serviceName, qty: 1, unitPrice: booking.amount }];
  const total = invoice?.items?.length ? invoiceTotal(invoice.items) : invoice?.amount || booking.amount;
  return (
    <Shell title="Ton devis" onClose={onClose}>
      <p className="mt-2 text-sm capitalize text-gray-500">
        {booking.dateLabel} · {booking.time} · {booking.place === "domicile" ? "À domicile" : "Salon Nord Foire"}
      </p>
      <ul className="mt-5 space-y-2 border-y border-black/10 py-4 text-sm">
        {lines.map((line, index) => (
          <li key={`${line.name}-${index}`} className="flex justify-between gap-3">
            <span className="text-gray-500">
              {line.name}
              {line.qty > 1 ? ` × ${line.qty}` : ""}
            </span>
            <span className="text-black">{formatFcfa(line.unitPrice * line.qty)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between text-sm">
        <span className="text-gray-500">{invoice?.number || "Total à payer"}</span>
        <span className="font-medium text-black">{formatFcfa(total)}</span>
      </p>
      <button type="button" onClick={onClose} className="btn-black mt-6 h-11 w-full cursor-pointer rounded-lg text-sm font-medium">
        Fermer
      </button>
    </Shell>
  );
}

export function QuoteConfirmPopup({
  open,
  booking,
  invoice,
  onClose,
  onPayHere,
  onPaySalon,
  busy,
  error,
}: {
  open: boolean;
  booking: Booking | null;
  invoice?: Invoice;
  onClose: () => void;
  onPayHere: () => void;
  onPaySalon: () => void;
  busy: "" | "here" | "salon";
  error: string;
}) {
  useLockBody(open, onClose);
  if (!open || !booking) return null;
  const total = invoice?.items?.length ? invoiceTotal(invoice.items) : invoice?.amount || booking.amount;
  return (
    <Shell title="Confirmer" onClose={onClose}>
      <p className="mt-2 text-sm text-gray-500">
        {booking.serviceName} · {formatFcfa(total)}
      </p>
      <p className="mt-1 text-sm capitalize text-gray-500">
        {booking.dateLabel} · {booking.time}
      </p>
      {error ? <p className="mt-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
      <div className="mt-6 grid grid-cols-1 gap-2">
        <button
          type="button"
          disabled={busy !== ""}
          onClick={onPayHere}
          className="btn-gold h-12 cursor-pointer rounded-lg text-sm font-medium disabled:opacity-60"
        >
          {busy === "here" ? "Redirection…" : "Payer ici"}
        </button>
        <button
          type="button"
          disabled={busy !== ""}
          onClick={onPaySalon}
          className="h-12 cursor-pointer rounded-lg bg-gray-900 text-sm font-medium text-black ring-1 ring-black/10 hover:bg-gray-200 disabled:opacity-60"
        >
          {busy === "salon" ? "Enregistrement…" : "Payer au salon"}
        </button>
      </div>
    </Shell>
  );
}
