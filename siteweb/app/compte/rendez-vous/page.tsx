"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Booking, BookingStatus, Invoice, LoyaltyEvent, Membership, PublicClient } from "@/lib/salon-types";
import { formatFcfa, invoiceTotal } from "@/lib/money";
import { goToPaytech, openPaytechWindow } from "@/lib/paytech-tab";
import { QuoteConfirmPopup, QuoteViewPopup } from "@/components/QuotePopups";

type Dashboard = {
  client: PublicClient;
  membership: Membership | null;
  loyalty: LoyaltyEvent[];
  bookings: Booking[];
  invoices: Invoice[];
};

const BOOKING_LABEL: Record<BookingStatus, string> = {
  nouveau: "En attente",
  confirme: "Confirmé",
  termine: "Terminé",
  annule: "Annulé",
};

export default function CompteRendezVousPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);
  const [confirmBusy, setConfirmBusy] = useState<"" | "here" | "salon">("");
  const [confirmError, setConfirmError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/compte/me", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/compte/login");
      return;
    }
    const json = (await res.json()) as Dashboard & { error?: string };
    if (!res.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    setData(json);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

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
          name: data?.client.name || booking.name,
          phone: data?.client.phone || booking.phone,
          email: data?.client.email || booking.email || "",
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

  if (!data) {
    return (
      <main className="mx-auto max-w-5xl px-6 pt-32 pb-20">
        <p className="text-sm text-gray-500">{error || "Chargement…"}</p>
      </main>
    );
  }

  const upcoming = data.bookings.filter((item) => item.status === "nouveau" || item.status === "confirme");
  const past = data.bookings.filter((item) => item.status === "termine" || item.status === "annule").slice(0, 8);
  const invoiceFor = (booking: Booking | null) =>
    booking
      ? data.invoices.find((row) => row.id === booking.invoiceId || row.bookingId === booking.id)
      : undefined;

  return (
    <main className="mx-auto max-w-5xl px-6 pt-32 pb-24">
      <Link href="/compte" className="text-sm text-gray-500 hover:text-black">
        ← Mon compte
      </Link>
      <div className="mt-5 flex items-end justify-between gap-3">
        <h1 className="font-bebas text-5xl text-black sm:text-6xl">Mes Rendez-vous</h1>
        <Link href="/rendez-vous" className="text-sm text-[#e0b12c] hover:text-black">
          Réserver
        </Link>
      </div>
      {error ? <p className="mt-6 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
      {upcoming.length === 0 ? <p className="mt-8 text-sm text-gray-500">Aucun rendez-vous à venir.</p> : null}
      <ul className="mt-8 space-y-3">
        {upcoming.map((item) => {
          const invoice = invoiceFor(item);
          const quoteBooking =
            item.paymentStatus !== "paid" &&
            (item.quoted || item.amount <= 0 || /devis/i.test(invoice?.note || ""));
          const waitingQuote = quoteBooking && item.amount <= 0;
          const quoteReady = quoteBooking && item.amount > 0;
          const salonChosen = quoteReady && item.paymentMethod === "especes";
          return (
            <li key={item.id} className="rounded-xl bg-gray-950 px-4 py-4 ring-1 ring-black/10">
              <p className="text-sm text-black">
                {item.dateLabel} · {item.time}
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
                        className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-xs text-black ring-1 ring-black/10 hover:bg-gray-200"
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
              ) : item.paymentStatus !== "paid" && item.status !== "annule" ? (
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
        })}
      </ul>
      {past.length > 0 ? (
        <ul className="mt-6 space-y-2">
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
    </main>
  );
}
