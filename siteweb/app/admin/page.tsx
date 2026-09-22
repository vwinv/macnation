"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarBlank, CaretLeft, CaretRight, List } from "@phosphor-icons/react";
import HoursSettingsModal from "@/components/admin/HoursSettingsModal";
import AgendaBookingCard from "@/components/admin/AgendaBookingCard";
import AdminQuotePopup from "@/components/admin/AdminQuotePopup";
import type { Booking, BookingStatus, Invoice } from "@/lib/salon-types";
import type { InvoiceLine } from "@/lib/money";

const FILTERS = [
  { id: "tous", label: "Tous" },
  { id: "aujourd-hui", label: "Aujourd'hui" },
  { id: "nouveau", label: "Nouveaux" },
  { id: "confirme", label: "Confirmés" },
  { id: "impaye", label: "Impayés" },
  { id: "termine", label: "Terminés" },
  { id: "annule", label: "Annulés" },
] as const;

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

type ViewMode = "liste" | "calendrier";

type ScheduleHour = {
  weekday: number;
  closed: boolean;
};

function todayIso() {
  const d = new Date();
  return toIso(d);
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function AdminPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paydunyaReady, setPaydunyaReady] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("tous");
  const [view, setView] = useState<ViewMode>("liste");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quoteBooking, setQuoteBooking] = useState<Booking | null>(null);
  const [hours, setHours] = useState<ScheduleHour[]>([]);
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const load = useCallback(async () => {
    const [salonRes, scheduleRes] = await Promise.all([
      fetch("/api/admin/salon", { cache: "no-store" }),
      fetch("/api/admin/schedule", { cache: "no-store" }),
    ]);
    if (salonRes.status === 401 || scheduleRes.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = (await salonRes.json()) as { bookings?: Booking[]; invoices?: Invoice[]; paydunyaReady?: boolean; error?: string };
    if (!salonRes.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    const nextBookings = json.bookings || [];
    setBookings(nextBookings);
    setInvoices(json.invoices || []);
    setPaydunyaReady(Boolean(json.paydunyaReady));
    const upcoming = nextBookings
      .filter((item) => item.status !== "annule" && item.dateIso)
      .sort((a, b) => `${a.dateIso}${a.time}`.localeCompare(`${b.dateIso}${b.time}`))[0];
    if (upcoming?.dateIso) {
      const [y, m, d] = upcoming.dateIso.split("-").map(Number);
      const day = new Date(y, (m || 1) - 1, d || 1);
      setCursor(new Date(day.getFullYear(), day.getMonth(), 1));
      setSelected(day);
    }
    if (scheduleRes.ok) {
      const schedule = (await scheduleRes.json()) as { hours?: ScheduleHour[]; closedDates?: { dateIso?: string }[] };
      setHours(schedule.hours || []);
      setClosedDates((schedule.closedDates || []).map((item) => item.dateIso || "").filter(Boolean));
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: BookingStatus) {
    setError("");
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json().catch(() => null)) as { booking?: Booking; error?: string } | null;
    if (!res.ok || !json?.booking) {
      setError(json?.error || "Mise à jour du rendez-vous impossible.");
      return;
    }
    setBookings((current) => current.map((item) => (item.id === id ? json.booking! : item)));
  }

  async function ensureInvoice(bookingId: string) {
    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    const json = (await res.json()) as { invoice?: Invoice; error?: string };
    if (!res.ok || !json.invoice) throw new Error(json.error || "Facture impossible.");
    setInvoices((current) => {
      const rest = current.filter((item) => item.id !== json.invoice!.id);
      return [json.invoice!, ...rest];
    });
    setBookings((current) =>
      current.map((item) => (item.id === bookingId ? { ...item, invoiceId: json.invoice!.id, amount: json.invoice!.amount } : item)),
    );
    return json.invoice;
  }

  async function openInvoice(item: Booking) {
    try {
      const invoice = item.invoiceId ? invoices.find((row) => row.id === item.invoiceId) || (await ensureInvoice(item.id)) : await ensureInvoice(item.id);
      router.push(`/admin/factures/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Facture impossible.");
    }
  }

  async function encaisser(booking: Booking, method: "especes" | "wave" | "orange" | "free") {
    setBusy(`${booking.id}-${method}`);
    setError("");
    try {
      const invoice = booking.invoiceId ? invoices.find((item) => item.id === booking.invoiceId) || (await ensureInvoice(booking.id)) : await ensureInvoice(booking.id);
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, method }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Encaissement impossible.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Encaissement impossible.");
    } finally {
      setBusy("");
    }
  }

  async function sendQuote(booking: Booking, items: InvoiceLine[]) {
    setBusy(`${booking.id}-quote`);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = (await res.json()) as { booking?: Booking; error?: string };
      if (!res.ok || !json.booking) throw new Error(json.error || "Devis impossible.");
      setQuoteBooking(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Devis impossible.");
    } finally {
      setBusy("");
    }
  }

  async function payerMobile(booking: Booking) {
    setBusy(`${booking.id}-mm`);
    setError("");
    try {
      const invoice = booking.invoiceId ? invoices.find((item) => item.id === booking.invoiceId) || (await ensureInvoice(booking.id)) : await ensureInvoice(booking.id);
      const res = await fetch(`/api/admin/invoices/${invoice.id}/paytech`, { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "PayTech indisponible.");
      window.open(json.url, "_blank", "noopener,noreferrer");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PayTech indisponible.");
    } finally {
      setBusy("");
    }
  }

  const today = todayIso();
  const visible = useMemo(() => {
    return bookings.filter((item) => {
      if (filter === "tous") return true;
      if (filter === "aujourd-hui") return item.dateIso === today;
      if (filter === "impaye") return item.paymentStatus !== "paid" && item.status !== "annule";
      return item.status === filter;
    });
  }, [bookings, filter, today]);

  const grouped = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const item of visible) {
      const key = item.dateIso || item.dateLabel;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return [...map.entries()];
  }, [visible]);

  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const item of visible) {
      if (!item.dateIso) continue;
      const list = map.get(item.dateIso) || [];
      list.push(item);
      map.set(item.dateIso, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [visible]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (Date | null)[] = [];
    for (let i = 0; i < lead; i += 1) grid.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) grid.push(new Date(year, month, d));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [cursor]);

  const selectedIso = toIso(selected);
  const selectedItems = byDay.get(selectedIso) || [];
  const selectedLabel = selectedItems[0]?.dateLabel || new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(selected);

  function isClosedDay(day: Date) {
    const iso = toIso(day);
    if (closedDates.includes(iso)) return true;
    const hour = hours.find((item) => item.weekday === day.getDay());
    return hour?.closed === true;
  }

  const stats = {
    today: bookings.filter((item) => item.dateIso === today && item.status !== "annule").length,
    nouveau: bookings.filter((item) => item.status === "nouveau").length,
    unpaid: bookings.filter((item) => item.paymentStatus !== "paid" && item.status !== "annule").length,
  };

  const cardProps = {
    busy,
    onStatus: (id: string, status: BookingStatus) => void setStatus(id, status),
    onOpenInvoice: (item: Booking) => void openInvoice(item),
    onEncaisser: (item: Booking, method: "especes" | "wave" | "orange" | "free") => void encaisser(item, method),
    onPayerMobile: (item: Booking) => void payerMobile(item),
    onOpenQuote: (item: Booking) => {
      setError("");
      setQuoteBooking(item);
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.22em] text-[#e0b12c]">NORD FOIRE</p>
          <h1 className="font-bebas mt-1 text-5xl text-black">Agenda</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="h-10 cursor-pointer rounded-lg bg-gray-900 px-4 text-sm text-black ring-1 ring-black/10 hover:bg-gray-800"
          >
            Paramétrages
          </button>
          {!paydunyaReady ? <p className="text-xs text-gray-500">PayTech : clés API à ajouter pour Wave / Orange / Free.</p> : null}
        </div>
      </div>

      {settingsOpen ? (
        <HoursSettingsModal
          onClose={() => {
            setSettingsOpen(false);
            void load();
          }}
        />
      ) : null}
      {quoteBooking ? (
        <AdminQuotePopup
          booking={quoteBooking}
          busy={busy === `${quoteBooking.id}-quote`}
          error={error}
          onClose={() => {
            if (busy === `${quoteBooking.id}-quote`) return;
            setQuoteBooking(null);
            setError("");
          }}
          onSubmit={(items) => void sendQuote(quoteBooking, items)}
        />
      ) : null}

      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { k: "Aujourd'hui", v: stats.today },
          { k: "Nouveaux", v: stats.nouveau },
          { k: "Impayés", v: stats.unpaid },
        ].map((item) => (
          <div key={item.k} className="rounded-2xl bg-gray-950 px-4 py-5 stroke-gradient [--stroke-opacity:0.15]">
            <p className="text-xs text-gray-500">{item.k}</p>
            <p className="font-bebas mt-1 text-4xl text-black">{item.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(
            [
              { id: "calendrier", label: "Calendrier", Icon: CalendarBlank },
              { id: "liste", label: "Liste", Icon: List },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm ${
                view === item.id ? "btn-gold font-medium" : "bg-gray-900 text-gray-400 ring-1 ring-black/10 hover:text-black"
              }`}
            >
              <item.Icon size={16} />
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`h-9 cursor-pointer rounded-full px-4 text-sm ${
                filter === item.id ? "btn-gold" : "bg-gray-900 text-gray-400 ring-1 ring-black/10 hover:text-black"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

      {view === "calendrier" ? (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-bebas text-3xl text-black">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </h2>
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
              {WEEKDAYS.map((d) => (
                <span key={d} className="py-2">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} className="min-h-[5.5rem] border-b border-r border-white/5 bg-black/20 sm:min-h-[7.5rem]" />;
                const iso = toIso(day);
                const items = byDay.get(iso) || [];
                const active = sameDay(day, selected);
                const isToday = iso === today;
                const closed = isClosedDay(day);
                const count = items.filter((item) => item.status !== "annule").length;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelected(day)}
                    className={`min-h-[5.5rem] cursor-pointer border-b border-r border-white/5 p-1.5 text-left transition-colors sm:min-h-[7.5rem] sm:p-2 ${
                      active ? "bg-[#e0b12c]/15" : closed ? "bg-black/40 hover:bg-black/20" : "hover:bg-black/5"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                          isToday ? "bg-[#e0b12c] font-semibold text-black" : active ? "font-semibold text-black" : "text-gray-600"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {count > 0 ? <span className="rounded-full bg-[#e0b12c]/20 px-1.5 text-[10px] text-[#e0b12c]">{count}</span> : null}
                    </span>
                    {closed && count === 0 ? <p className="mt-1 hidden text-[10px] text-gray-600 sm:block">Fermé</p> : null}
                    <ul className="mt-1 hidden space-y-0.5 sm:block">
                      {items.slice(0, 3).map((item) => (
                        <li
                          key={item.id}
                          className={`truncate text-[11px] ${item.status === "annule" ? "text-gray-600 line-through" : "text-gray-600"}`}
                        >
                          <span className="text-[#e0b12c]">{item.time}</span> {item.name}
                        </li>
                      ))}
                      {items.length > 3 ? <li className="text-[10px] text-gray-500">+{items.length - 3}</li> : null}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          <section className="mt-8">
            <h2 className="font-bebas text-2xl capitalize text-[#e0b12c]">{selectedLabel}</h2>
            {selectedItems.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                {isClosedDay(selected) ? "Boutique fermée ce jour-là." : "Aucun rendez-vous ce jour-là."}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {selectedItems.map((item) => (
                  <AgendaBookingCard key={item.id} item={item} {...cardProps} />
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {grouped.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun rendez-vous pour ce filtre.</p>
          ) : (
            grouped.map(([day, items]) => (
              <section key={day}>
                <h2 className="font-bebas text-2xl text-[#e0b12c]">{items[0]?.dateLabel || day}</h2>
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <AgendaBookingCard key={item.id} item={item} {...cardProps} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}
    </main>
  );
}
