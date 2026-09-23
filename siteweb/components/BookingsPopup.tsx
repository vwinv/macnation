"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CalendarBlank, CaretLeft, CaretRight, List, X } from "@phosphor-icons/react";
import type { Booking, BookingStatus, Invoice } from "@/lib/salon-types";
import { formatFcfa, invoiceTotal } from "@/lib/money";
import { goToPaytech, openPaytechWindow } from "@/lib/paytech-tab";
import { QuoteConfirmPopup, QuoteViewPopup } from "@/components/QuotePopups";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

const BOOKING_LABEL: Record<BookingStatus, string> = {
  nouveau: "En attente",
  confirme: "Confirmé",
  termine: "Terminé",
  annule: "Annulé",
};

type ViewMode = "liste" | "calendrier";

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function monthCells(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startPad = (first.getDay() + 6) % 7;
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: startPad }, () => null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export default function BookingsPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [view, setView] = useState<ViewMode>("liste");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);
  const [confirmBusy, setConfirmBusy] = useState<"" | "here" | "salon">("");
  const [confirmError, setConfirmError] = useState("");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/compte/me", { cache: "no-store", credentials: "include" });
    const json = (await res.json().catch(() => null)) as { bookings?: Booking[]; invoices?: Invoice[]; error?: string } | null;
    if (!res.ok) {
      setError(json?.error || "Chargement impossible.");
      return;
    }
    setBookings(json?.bookings || []);
    setInvoices(json?.invoices || []);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError("");
    setView("liste");
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !viewBooking && !confirmBooking) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, viewBooking, confirmBooking]);

  const invoiceFor = (booking: Booking | null) =>
    booking ? invoices.find((row) => row.id === booking.invoiceId || row.bookingId === booking.id) : undefined;

  const upcoming = bookings.filter((item) => item.status === "nouveau" || item.status === "confirme");
  const past = bookings.filter((item) => item.status === "termine" || item.status === "annule");

  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const item of bookings) {
      const key = item.dateIso || item.dateLabel;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [bookings]);

  const selectedItems = byDay.get(toIso(selected)) || [];
  const today = toIso(new Date());

  async function cancelBooking(booking: Booking) {
    if (!window.confirm("Annuler ce rendez-vous ?")) return;
    setBusy(`cancel-${booking.id}`);
    setError("");
    try {
      const res = await fetch(`/api/compte/bookings/${booking.id}/cancel`, { method: "POST" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Annulation impossible.");
        return;
      }
      await load();
    } finally {
      setBusy("");
    }
  }

  async function payQuoteHere(booking: Booking) {
    if (!booking.invoiceId) {
      setConfirmError("Facture introuvable.");
      return;
    }
    setConfirmBusy("here");
    setConfirmError("");
    const tab = openPaytechWindow();
    try {
      const res = await fetch("/api/paytech/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: booking.invoiceId,
          name: booking.name,
          phone: booking.phone,
          email: booking.email || "",
          source: "site",
        }),
      });
      const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !json?.url) {
        tab?.close();
        setConfirmError(json?.error || "Paiement indisponible.");
        return;
      }
      if (!goToPaytech(json.url, tab)) {
        setConfirmError("Autorise la fenêtre de paiement, puis réessaie.");
      }
    } catch {
      setConfirmError("Connexion interrompue. Réessaie.");
    } finally {
      setConfirmBusy("");
    }
  }

  async function payQuoteSalon(booking: Booking) {
    setConfirmBusy("salon");
    setConfirmError("");
    try {
      const res = await fetch(`/api/compte/bookings/${booking.id}/salon`, { method: "POST" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setConfirmError(json?.error || "Enregistrement impossible.");
        return;
      }
      setConfirmBooking(null);
      await load();
    } finally {
      setConfirmBusy("");
    }
  }

  function renderItem(item: Booking, compact = false) {
    const invoice = invoiceFor(item);
    const quoteBooking =
      item.paymentStatus !== "paid" && (item.quoted || item.amount <= 0 || /devis/i.test(invoice?.note || ""));
    const waitingQuote = quoteBooking && item.amount <= 0;
    const quoteReady = quoteBooking && item.amount > 0;
    const salonChosen = quoteReady && item.paymentMethod === "especes";
    return (
      <li key={item.id} className="rounded-xl bg-gray-950 px-4 py-4 ring-1 ring-black/10">
        <p className="text-sm text-black">
          {compact ? item.time : `${item.dateLabel} · ${item.time}`}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {item.serviceName}
          {quoteBooking ? "" : ` · ${BOOKING_LABEL[item.status]}`}
        </p>
        {waitingQuote || quoteReady ? (
          <div className="mt-3 space-y-3">
            {quoteReady ? (
              <p className="text-sm text-black">
                Devis :{" "}
                <span className="font-medium">
                  {formatFcfa(invoice?.items?.length ? invoiceTotal(invoice.items) : invoice?.amount || item.amount)}
                </span>
              </p>
            ) : null}
            {salonChosen ? (
              <p className="text-xs text-gray-500">Confirmé · tu paies au salon, non payé.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setViewBooking(item)}
                  className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-xs text-black ring-1 ring-black/10 hover:bg-gray-800"
                >
                  Voir le devis
                </button>
                {quoteReady ? (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmError("");
                      setConfirmBooking(item);
                    }}
                    className="btn-gold h-9 cursor-pointer rounded-lg px-3 text-xs font-medium"
                  >
                    Confirmer
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy === `cancel-${item.id}`}
                  onClick={() => void cancelBooking(item)}
                  className="h-9 cursor-pointer rounded-lg px-3 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            )}
            {salonChosen ? (
              <button
                type="button"
                disabled={busy === `cancel-${item.id}`}
                onClick={() => void cancelBooking(item)}
                className="h-9 cursor-pointer rounded-lg px-3 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                Annuler
              </button>
            ) : null}
          </div>
        ) : item.paymentStatus !== "paid" && item.status !== "annule" && item.status !== "termine" ? (
          <button
            type="button"
            disabled={busy === `cancel-${item.id}`}
            onClick={() => void cancelBooking(item)}
            className="mt-3 h-9 cursor-pointer rounded-lg px-3 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            Annuler
          </button>
        ) : null}
      </li>
    );
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 p-4 pt-24 sm:items-center sm:pt-8"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookings-popup-title"
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
            <h2 id="bookings-popup-title" className="font-bebas mt-2 text-4xl text-black">
              Mes Rendez-vous
            </h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-gray-900 text-black hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          {(
            [
              { id: "liste", label: "Liste", Icon: List },
              { id: "calendrier", label: "Calendrier", Icon: CalendarBlank },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm ${
                view === item.id ? "btn-gold font-medium" : "bg-gray-900 text-gray-500 ring-1 ring-black/10 hover:text-black"
              }`}
            >
              <item.Icon size={16} />
              {item.label}
            </button>
          ))}
        </div>

        {error ? <p className="mt-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}

        {view === "liste" ? (
          <div className="mt-6">
            {upcoming.length === 0 ? <p className="text-sm text-gray-500">Aucun rendez-vous à venir.</p> : null}
            <ul className="space-y-3">{upcoming.map((item) => renderItem(item))}</ul>
            {past.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {past.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 text-sm text-gray-500">
                    <span>
                      {item.dateLabel} · {item.serviceName}
                    </span>
                    <span>{BOOKING_LABEL[item.status]}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bebas text-2xl text-black">
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Mois précédent"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-gray-900 text-black hover:bg-gray-800"
                >
                  <CaretLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                    setSelected(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
                  }}
                  className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-gray-600 hover:bg-gray-800"
                >
                  Aujourd’hui
                </button>
                <button
                  type="button"
                  aria-label="Mois suivant"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-gray-900 text-black hover:bg-gray-800"
                >
                  <CaretRight size={16} />
                </button>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl bg-gray-950 ring-1 ring-black/10">
              <div className="grid grid-cols-7 border-b border-black/10 text-center text-[11px] text-gray-500">
                {WEEKDAYS.map((day) => (
                  <span key={day} className="py-2">
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthCells(cursor).map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} className="min-h-12 border-b border-r border-black/5" />;
                  const iso = toIso(day);
                  const items = (byDay.get(iso) || []).filter((item) => item.status !== "annule");
                  const active = sameDay(day, selected);
                  const isToday = iso === today;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelected(day)}
                      className={`flex min-h-12 cursor-pointer flex-col items-center justify-center border-b border-r border-black/5 py-1.5 ${
                        active ? "bg-[#e0b12c]/15" : "hover:bg-black/5"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                          isToday ? "bg-[#e0b12c] font-semibold text-black" : active ? "font-semibold text-black" : "text-gray-600"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {items.length > 0 ? <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#e0b12c]" /> : <span className="mt-0.5 h-1.5 w-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="font-bebas mt-5 text-xl capitalize text-[#e0b12c]">
              {selectedItems[0]?.dateLabel ||
                new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(selected)}
            </p>
            {selectedItems.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">Aucun rendez-vous ce jour-là.</p>
            ) : (
              <ul className="mt-3 space-y-3">{selectedItems.map((item) => renderItem(item, true))}</ul>
            )}
          </div>
        )}

        <Link
          href="/rendez-vous"
          className="btn-black mt-6 flex h-12 items-center justify-center rounded-lg text-sm font-medium"
        >
          Réserver
        </Link>
      </div>
      <QuoteViewPopup
        open={Boolean(viewBooking)}
        booking={viewBooking}
        invoice={invoiceFor(viewBooking)}
        onClose={() => setViewBooking(null)}
      />
      <QuoteConfirmPopup
        open={Boolean(confirmBooking)}
        booking={confirmBooking}
        invoice={invoiceFor(confirmBooking)}
        onClose={() => {
          if (confirmBusy) return;
          setConfirmBooking(null);
          setConfirmError("");
        }}
        onPayHere={() => confirmBooking && void payQuoteHere(confirmBooking)}
        onPaySalon={() => confirmBooking && void payQuoteSalon(confirmBooking)}
        busy={confirmBusy}
        error={confirmError}
      />
    </div>,
    document.body,
  );
}
