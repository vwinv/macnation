"use client";

import { FormEvent, Fragment, useEffect, useMemo, useRef, useState } from "react";
import { CaretLeft, CaretRight, CheckCircle } from "@phosphor-icons/react";
import { bookingAmount, DOMICILE_FEE, formatFcfa } from "@/lib/money";
import SoftPay from "@/components/SoftPay";

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

const STEP_LABELS = ["Prestation", "Créneau", "Paiement"] as const;

type Confirmation = {
  name: string;
  phone: string;
  email: string;
  service: string;
  dateLabel: string;
  time: string;
  place: "salon" | "domicile";
  address: string;
  invoiceId?: string;
  pendingId?: string;
  amount?: number;
  accountCreated?: boolean;
  loginRequired?: boolean;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(date);
}

function dateLabel(date: Date) {
  return `${weekdayLabel(date)} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

type BookingService = {
  id: string;
  name: string;
  duration: string;
  price: number | null;
  priceLabel: string | null;
};

type DaySlot = {
  time: string;
  end?: string;
  label?: string;
  available?: boolean;
};

type ScheduleHour = {
  weekday: number;
  closed: boolean;
  openTime: string;
  closeTime: string;
};

function servicePriceLabel(item: BookingService) {
  if (item.priceLabel) return item.priceLabel;
  if (item.price == null) return "Sur devis";
  return formatFcfa(item.price);
}

function quotedPriceLabel(item: BookingService, place: "salon" | "domicile") {
  if (place !== "domicile" || item.id === "domicile") return servicePriceLabel(item);
  if (item.price != null) return formatFcfa(bookingAmount(item.price, place, item.id));
  return `${item.priceLabel || "Sur devis"} + ${formatFcfa(DOMICILE_FEE)}`;
}

function StepsBar({ step }: { step: number }) {
  return (
    <div
      className="flex items-start"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={step + 1}
      aria-label="Étapes de réservation"
    >
      {STEP_LABELS.map((label, i) => (
        <Fragment key={label}>
          {i > 0 ? (
            <div className={`mx-2 mt-3 h-px min-w-4 flex-1 ${i <= step ? "bg-[#e0b12c]" : "bg-black/10"}`} />
          ) : null}
          <div className="flex w-16 shrink-0 flex-col items-center sm:w-20">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                i <= step ? "bg-[#e0b12c] text-black" : "bg-gray-900 text-gray-500 ring-1 ring-black/10"
              }`}
            >
              {i + 1}
            </span>
            <span className={`mt-1 text-[11px] ${i <= step ? "text-black" : "text-gray-500"}`}>{label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

export default function BookingForm({ initialServiceId }: { initialServiceId?: string }) {
  const [step, setStep] = useState(0);
  const [today, setToday] = useState<Date | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [timeLabel, setTimeLabel] = useState("");
  const [place, setPlace] = useState<"salon" | "domicile">("salon");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Confirmation | null>(null);
  const [payNow, setPayNow] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [dayClosed, setDayClosed] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [serviceId, setServiceId] = useState(initialServiceId || "");
  const [hours, setHours] = useState<ScheduleHour[]>([]);
  const [closedDates, setClosedDates] = useState<string[]>([]);

  const service = services.find((s) => s.id === serviceId) || null;

  useEffect(() => {
    if (!initialServiceId) return;
    if (services.some((item) => item.id === initialServiceId)) {
      setServiceId(initialServiceId);
      if (initialServiceId === "domicile") setPlace("domicile");
    }
  }, [initialServiceId, services]);

  useEffect(() => {
    fetch("/api/catalog/services", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: BookingService[] | { error?: string }) => {
        if (Array.isArray(json)) setServices(json);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch("/api/bookings/schedule", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { hours?: ScheduleHour[]; closedDates?: string[] }) => {
        if (Array.isArray(json.hours)) setHours(json.hours);
        if (Array.isArray(json.closedDates)) setClosedDates(json.closedDates);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const d = startOfDay(new Date());
    setToday(d);
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }, []);

  useEffect(() => {
    fetch("/api/compte/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { name?: string; phone?: string; email?: string }) => {
        if (json.name || json.phone) {
          setName((current) => current || json.name || "");
          setPhone((current) => current || json.phone || "");
          setEmail((current) => current || json.email || "");
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selected || !serviceId) {
      setSlots([]);
      setDayClosed("");
      setSlotsLoading(false);
      return;
    }
    const iso = toIso(selected);
    let cancelled = false;
    setSlotsLoading(true);
    fetch(`/api/bookings/slots?date=${iso}&service=${encodeURIComponent(serviceId)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { closed?: boolean; reason?: string; slots?: DaySlot[]; error?: string } | DaySlot[]) => {
        if (cancelled) return;
        if (Array.isArray(json)) {
          setDayClosed("");
          setSlots(json.filter((slot) => slot.available !== false));
          return;
        }
        if (json.closed) {
          setDayClosed(json.reason || "Fermé");
          setSlots([]);
          return;
        }
        setDayClosed("");
        setSlots((json.slots || []).filter((slot) => slot.available !== false));
      })
      .catch(() => {
        if (!cancelled) {
          setDayClosed("");
          setSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, serviceId]);

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

  function isClosedDay(day: Date) {
    const iso = toIso(day);
    if (closedDates.includes(iso)) return true;
    const hour = hours.find((item) => item.weekday === day.getDay());
    return hour?.closed === true;
  }

  function showMessage(message: string) {
    setError(message);
    requestAnimationFrame(() => {
      box.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function goTo(next: number) {
    setError("");
    setStep(next);
    requestAnimationFrame(() => {
      box.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !service || !selected || !time) {
      showMessage("Choisissez un jour, une heure et une prestation, puis indiquez votre nom et votre téléphone.");
      return;
    }
    if (place === "domicile" && !address.trim()) {
      showMessage("Pour une coiffure à domicile, indiquez le quartier et l'adresse.");
      return;
    }

    const confirmation: Confirmation = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      service: `${service.name} · ${quotedPriceLabel(service, place)}`,
      dateLabel: dateLabel(selected),
      time: timeLabel || time,
      place,
      address: address.trim(),
    };

    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: confirmation.name,
          phone: confirmation.phone,
          email: confirmation.email,
          serviceId: service.id,
          dateLabel: confirmation.dateLabel,
          dateIso: toIso(selected),
          time,
          place,
          address: confirmation.address,
          payNow,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: string;
        invoiceId?: string;
        pendingId?: string;
        amount?: number;
        accountCreated?: boolean;
        loginRequired?: boolean;
      } | null;
      if (!res.ok) {
        showMessage(json?.error || "Impossible d'envoyer la demande. Réessayez.");
        return;
      }
      setDone({
        ...confirmation,
        invoiceId: json?.invoiceId,
        pendingId: json?.pendingId,
        amount: json?.amount,
        accountCreated: json?.accountCreated,
        loginRequired: json?.loginRequired,
      });
      requestAnimationFrame(() => {
        box.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } catch {
      showMessage("Connexion interrompue. Vérifiez internet et réessayez.");
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setDone(null);
    setStep(0);
    setSelected(null);
    setTime("");
    setTimeLabel("");
    setServiceId("");
    setPlace("salon");
    setPayNow(true);
    setError("");
    setAddress("");
  }

  return (
    <div ref={box} className="scroll-mt-28 rounded-2xl bg-gray-950 p-6 stroke-gradient [--stroke-opacity:0.2] sm:p-8">
      {done ? (
        <div className="flex flex-col items-start gap-5">
          {done.pendingId ? null : <CheckCircle size={42} weight="fill" className="text-[#e0b12c]" />}
          <div>
            <p className="font-bebas text-4xl text-black">
              {done.pendingId ? "Payer pour confirmer" : done.loginRequired ? "Connecte-toi pour confirmer" : "Rendez-vous demandé"}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {done.pendingId
                ? `Merci ${done.name}. Le rendez-vous n’est enregistré qu’après le paiement Wave, Orange Money ou Free Money.`
                : done.loginRequired
                  ? `Merci ${done.name}. Ton rendez-vous est enregistré. Connecte-toi pour le confirmer.`
                  : `Merci ${done.name}. Un SMS, un WhatsApp et un email de confirmation partent au ${done.phone}${done.email ? ` et ${done.email}` : ""}.`}
            </p>
          </div>
          <ul className="w-full space-y-3 border-y border-black/10 py-5 text-sm text-black">
            <li className="flex justify-between gap-4">
              <span className="text-gray-500">Quand</span>
              <span className="text-right capitalize">
                {done.dateLabel} · {done.time}
              </span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="text-gray-500">Prestation</span>
              <span className="text-right">{done.service}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="text-gray-500">Lieu</span>
              <span className="text-right">
                {done.place === "domicile" ? `À domicile · ${done.address}` : "Au salon, Nord Foire"}
              </span>
            </li>
            {typeof done.amount === "number" && done.amount > 0 ? (
              <li className="flex justify-between gap-4">
                <span className="text-gray-500">Montant</span>
                <span className="text-right">{formatFcfa(done.amount)}</span>
              </li>
            ) : null}
          </ul>
          {done.pendingId && (done.amount || 0) > 0 ? (
            <div className="w-full">
              <SoftPay
                pendingId={done.pendingId}
                amount={done.amount || 0}
                name={done.name}
                phone={done.phone}
                email={done.email}
                accountCreated={done.accountCreated}
                hideMethods
              />
            </div>
          ) : done.invoiceId && (done.amount || 0) > 0 ? (
            <div className="w-full">
              <SoftPay
                invoiceId={done.invoiceId}
                amount={done.amount || 0}
                name={done.name}
                phone={done.phone}
                email={done.email}
                accountCreated={done.accountCreated}
                hideMethods
              />
            </div>
          ) : null}
          <button type="button" onClick={reset} className="btn-black h-12 w-full cursor-pointer rounded-lg text-sm font-medium">
            Prendre un autre rendez-vous
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-7">
          <StepsBar step={step} />

          {step === 0 ? (
            <>
              <div>
                <p className="text-sm font-medium text-black">Paiement du rendez-vous</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "now", label: "Payer maintenant", hint: "Wave · Orange · Free" },
                      { id: "salon", label: "Payer au salon", hint: "Espèces ou Mobile Money" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPayNow(opt.id === "now")}
                      className={`cursor-pointer rounded-xl px-4 py-3 text-left transition-colors ${
                        (opt.id === "now") === payNow ? "btn-black" : "bg-gray-900 text-gray-600 ring-1 ring-black/10 hover:bg-gray-800"
                      }`}
                    >
                      <span className="block text-sm font-medium">{opt.label}</span>
                      <span className={`mt-0.5 block text-xs ${(opt.id === "now") === payNow ? "text-white/70" : "text-gray-500"}`}>
                        {opt.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-black">Lieu</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "salon", label: "Au salon", hint: "Nord Foire" },
                      { id: "domicile", label: "À domicile", hint: "+ 2 000 F" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPlace(opt.id)}
                      className={`cursor-pointer rounded-xl px-4 py-3 text-left transition-colors ${
                        place === opt.id ? "btn-black" : "bg-gray-900 text-gray-600 ring-1 ring-black/10 hover:bg-gray-800"
                      }`}
                    >
                      <span className="block text-sm font-medium">{opt.label}</span>
                      <span className={`mt-0.5 block text-xs ${place === opt.id ? "text-white/70" : "text-gray-500"}`}>
                        {opt.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-2 text-sm text-black">
                Prestation *
                <div className="flex items-center gap-3">
                  <select
                    name="service"
                    required
                    value={serviceId}
                    onChange={(e) => {
                      setServiceId(e.target.value);
                      setTime("");
                      setTimeLabel("");
                      setError("");
                    }}
                    className="h-12 min-w-0 flex-1 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
                  >
                    <option value="" disabled>
                      Choisir
                    </option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.duration}
                      </option>
                    ))}
                  </select>
                  {service ? (
                    <span className="shrink-0 font-medium text-black">{quotedPriceLabel(service, place)}</span>
                  ) : null}
                </div>
                {place === "domicile" && service && service.id !== "domicile" ? (
                  <span className="text-xs text-gray-500">Dont {formatFcfa(DOMICILE_FEE)} de déplacement.</span>
                ) : null}
              </label>

              {error ? (
                <p role="alert" className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={!serviceId}
                onClick={() => goTo(1)}
                className="btn-gold h-12 cursor-pointer rounded-lg text-sm font-medium active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Choisir un créneau
              </button>
            </>
          ) : null}

          {step === 1 ? (
            <>
              {service ? (
                <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-black/10">
                  <p className="font-medium text-black">{service.name}</p>
                  <p className="shrink-0 font-medium text-black">{quotedPriceLabel(service, place)}</p>
                </div>
              ) : null}

              <div>
                <div className="flex items-center justify-between">
                  <p className="font-bebas text-2xl text-black">
                    {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
                  </p>
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
                      aria-label="Mois suivant"
                      onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-gray-900 text-black hover:bg-gray-800"
                    >
                      <CaretRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-gray-500">
                  {WEEKDAYS.map((d) => (
                    <span key={d} className="py-1">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, i) => {
                    if (!day) return <span key={`e-${i}`} />;
                    const past = today ? startOfDay(day) < today : false;
                    const closed = isClosedDay(day);
                    const disabled = past || closed;
                    const active = selected ? sameDay(day, selected) : false;
                    return (
                      <button
                        key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                        type="button"
                        disabled={disabled}
                        title={closed && !past ? "Fermé" : undefined}
                        onClick={() => {
                          setSelected(day);
                          setTime("");
                          setTimeLabel("");
                          setError("");
                          if (serviceId) setSlotsLoading(true);
                        }}
                        className={`h-10 cursor-pointer rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:font-normal disabled:text-gray-300 ${
                          active ? "btn-black" : "text-black hover:bg-black/5 disabled:hover:bg-transparent"
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
                {selected ? (
                  <p className="mt-3 text-sm capitalize text-gray-400">{dateLabel(selected)}</p>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">Choisissez un jour.</p>
                )}
              </div>

              {selected ? (
                <div>
                  <p className="text-sm font-medium text-black">Plage horaire *</p>
                  {!serviceId ? (
                    <p className="mt-3 text-sm text-gray-500">Choisissez d’abord une prestation : les plages tiennent compte de sa durée.</p>
                  ) : slotsLoading ? (
                    <p className="mt-3 text-sm text-gray-500">Chargement des plages…</p>
                  ) : dayClosed ? (
                    <p className="mt-3 text-sm text-gray-500">Fermé ce jour-là{dayClosed !== "Fermé" ? ` · ${dayClosed}` : ""}.</p>
                  ) : slots.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">Plus de plage ce jour-là pour cette prestation. Choisissez une autre date.</p>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => {
                            setTime(slot.time);
                            setTimeLabel(slot.label || slot.time);
                            setError("");
                          }}
                          className={`h-10 cursor-pointer rounded-lg px-2 text-sm font-medium transition-colors ${
                            time === slot.time ? "btn-black" : "bg-gray-900 text-gray-600 ring-1 ring-black/10 hover:bg-gray-800"
                          }`}
                        >
                          {slot.label || slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {error ? (
                <p role="alert" className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => goTo(0)}
                  className="btn-black h-12 cursor-pointer rounded-lg text-sm font-medium"
                >
                  Retour
                </button>
                <button
                  type="button"
                  disabled={!selected || !time}
                  onClick={() => goTo(2)}
                  className="btn-gold h-12 cursor-pointer rounded-lg text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Coordonnées
                </button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              {service && selected ? (
                <div className="rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-black/10">
                  <p className="font-medium text-black">{service.name}</p>
                  <p className="mt-1 text-sm capitalize text-gray-500">
                    {dateLabel(selected)} · {timeLabel || time} · {place === "domicile" ? "À domicile" : "Salon"}
                  </p>
                  <p className="mt-2 font-medium text-black">{quotedPriceLabel(service, place)}</p>
                  {place === "domicile" && service.id !== "domicile" ? (
                    <p className="mt-1 text-xs text-gray-500">Dont {formatFcfa(DOMICILE_FEE)} de déplacement</p>
                  ) : null}
                </div>
              ) : null}

              {phone ? null : (
                <p className="text-sm text-gray-500">
                  Si tu n’as pas encore de compte, on le crée. Tu te connecteras ensuite pour confirmer le rendez-vous.
                </p>
              )}
              <label className="flex flex-col gap-2 text-sm font-medium text-black">
                Nom complet *
                <input
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-black">
                Téléphone *
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-black">
                Email
                <input
                  name="email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
                />
                <span className="text-xs font-normal text-gray-500">Pour le compte client et la confirmation par mail.</span>
              </label>
              {place === "domicile" ? (
                <label className="flex flex-col gap-2 text-sm font-medium text-black">
                  Adresse / quartier *
                  <input
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex. Nord Foire, près du service d'hygiène"
                    className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 placeholder:text-gray-500 focus:ring-[#e0b12c]/50"
                  />
                </label>
              ) : null}

              {error ? (
                <p role="alert" className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  className="btn-black h-12 cursor-pointer rounded-lg text-sm font-medium"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-gold h-12 cursor-pointer rounded-lg text-sm font-medium active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
                >
                  {sending ? (payNow ? "Préparation du paiement…" : "Envoi…") : payNow ? "Réserver et payer" : "Confirmer"}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Salon : lun–sam 10h–21h, dim 12h–20h. À domicile : déplacement 2 000 F, Dakar uniquement.
              </p>
            </>
          ) : null}
        </form>
      )}
    </div>
  );
}
