"use client";

import Link from "next/link";
import type { Booking, BookingStatus } from "@/lib/salon-types";
import { formatFcfa } from "@/lib/money";
import { hasSnPhone, telHref, whatsAppHref } from "@/lib/phone";

const STATUS_LABEL: Record<BookingStatus, string> = {
  nouveau: "Nouveau",
  confirme: "Confirmé",
  termine: "Terminé",
  annule: "Annulé",
};

export function endClock(time: string, durationMin: number) {
  const [h, m] = time.split(":").map(Number);
  const total = ((h || 0) * 60 + (m || 0) + durationMin + 24 * 60) % (24 * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function bookingRange(item: Booking) {
  if (item.durationMin) return `${item.time} – ${endClock(item.time, item.durationMin)}`;
  return item.time;
}

type Props = {
  item: Booking;
  busy: string;
  onStatus: (id: string, status: BookingStatus) => void;
  onOpenInvoice: (item: Booking) => void;
  onEncaisser: (item: Booking, method: "especes" | "wave" | "orange" | "free") => void;
  onPayerMobile: (item: Booking) => void;
  onOpenQuote: (item: Booking) => void;
};

export default function AgendaBookingCard({ item, busy, onStatus, onOpenInvoice, onEncaisser, onPayerMobile, onOpenQuote }: Props) {
  const needsQuote = item.paymentStatus !== "paid" && item.status !== "annule" && item.amount <= 0;
  return (
    <li className="rounded-2xl bg-gray-950 p-5 stroke-gradient [--stroke-opacity:0.15]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg text-black">
            <span className="font-medium text-[#e0b12c]">{bookingRange(item)}</span>
            <span className="mx-2 text-gray-600">·</span>
            {item.name}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {item.serviceName}
            <span className="mx-2 text-gray-600">·</span>
            {item.place === "domicile" ? `Domicile · ${item.address}` : "Salon Nord Foire"}
            <span className="mx-2 text-gray-600">·</span>
            <span className="text-black">{item.amount > 0 ? formatFcfa(item.amount) : "Sur devis"}</span>
          </p>
          <p className="mt-2 flex flex-wrap gap-3 text-sm">
            {hasSnPhone(item.phone) ? (
              <>
                <a className="text-[#e0b12c] hover:underline" href={telHref(item.phone)}>
                  {item.phone}
                </a>
                <a className="text-gray-400 hover:text-black" href={whatsAppHref(item.phone)} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </>
            ) : (
              <span className="text-gray-500">Pas de numéro</span>
            )}
            {item.email ? <span className="text-gray-500">{item.email}</span> : null}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              item.status === "nouveau"
                ? "bg-[#e0b12c]/15 text-[#e0b12c]"
                : item.status === "confirme"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : item.status === "annule"
                    ? "bg-red-500/15 text-red-300"
                    : "bg-white/10 text-gray-600"
            }`}
          >
            {STATUS_LABEL[item.status]}
          </span>
          <span className={`text-xs ${item.paymentStatus === "paid" ? "text-emerald-300" : "text-gray-500"}`}>
            {item.paymentStatus === "paid"
              ? "Payé"
              : item.paymentStatus === "pending"
                ? "Paiement en cours"
                : item.amount <= 0
                  ? "Devis à faire"
                  : item.paymentMethod === "especes"
                    ? "Devis accepté · salon"
                    : "Devis envoyé"}
          </span>
        </div>
      </div>
      <div className="mt-5 grid gap-4 border-t border-black/10 pt-4 sm:grid-cols-2">
        <div>
          <p className="text-xs tracking-[0.16em] text-gray-500">SUIVI DU RDV</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.status !== "confirme" && item.status !== "annule" ? (
              <button type="button" onClick={() => onStatus(item.id, "confirme")} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200">
                Confirmer (client vient)
              </button>
            ) : null}
            {item.status !== "termine" && item.status !== "annule" ? (
              <button type="button" onClick={() => onStatus(item.id, "termine")} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200">
                Prestation faite
              </button>
            ) : null}
            {needsQuote ? (
              <button
                type="button"
                onClick={() => onOpenQuote(item)}
                className="btn-gold h-9 cursor-pointer rounded-lg px-3 text-sm font-medium"
              >
                Faire le devis
              </button>
            ) : null}
            {item.invoiceId ? (
              <Link href={`/admin/factures/${item.invoiceId}`} className="flex h-9 items-center rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200">
                Voir la facture
              </Link>
            ) : (
              <button type="button" onClick={() => onOpenInvoice(item)} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200">
                Créer la facture
              </button>
            )}
            {item.status !== "annule" ? (
              <button type="button" onClick={() => onStatus(item.id, "annule")} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-red-300 hover:bg-red-500/10">
                Annuler le RDV
              </button>
            ) : null}
          </div>
        </div>
        {item.paymentStatus !== "paid" && item.status !== "annule" && !needsQuote ? (
          <div>
            <p className="text-xs tracking-[0.16em] text-gray-500">ENCAISSER AU SALON</p>
            <p className="mt-1 text-xs text-gray-500">Le client a déjà payé ici : tu marques juste le moyen.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" disabled={busy.startsWith(item.id)} onClick={() => onEncaisser(item, "especes")} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200 disabled:opacity-50">
                Espèces reçues
              </button>
              <button type="button" disabled={busy.startsWith(item.id)} onClick={() => onEncaisser(item, "wave")} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200 disabled:opacity-50">
                Wave reçu
              </button>
              <button type="button" disabled={busy.startsWith(item.id)} onClick={() => onEncaisser(item, "orange")} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200 disabled:opacity-50">
                Orange reçu
              </button>
              <button type="button" disabled={busy.startsWith(item.id)} onClick={() => onEncaisser(item, "free")} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200 disabled:opacity-50">
                Free reçu
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={() => onPayerMobile(item)} className="btn-gold h-9 cursor-pointer rounded-lg px-3 text-sm font-medium disabled:opacity-50">
                Envoyer un lien de paiement
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
}
