"use client";

import { FormEvent, Fragment, useEffect, useMemo, useRef, useState } from "react";
import { CaretLeft, CaretRight, CheckCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { bookingAmount, DOMICILE_FEE, formatFcfa, isQuotedService } from "@/lib/money";
import SoftPay from "@/components/SoftPay";
import { BOOKING_RESET_EVENT, BOOKING_SERVICE_EVENT, takeBookingService } from "@/lib/booking-intent";

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

const STEP_LABELS_PAY = ["Prestation", "Créneau", "Paiement"] as const;
const STEP_LABELS_QUOTE = ["Prestation", "Créneau", "Infos"] as const;

type MembershipInfo = {
  planName: string;
  visitsLeft: number;
  visitsTotal: number;
};

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
  usedMembership?: boolean;
  visitsLeft?: number;
  visitsTotal?: number;
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
  if (isQuotedService(item.price, item.priceLabel)) return item.priceLabel || "Sur devis";
  if (place !== "domicile" || item.id === "domicile") return servicePriceLabel(item);
  return formatFcfa(bookingAmount(item.price ?? 0, place, item.id));
}

function StepsBar({ step, onQuote }: { step: number; onQuote: boolean }) {
  const labels = onQuote ? STEP_LABELS_QUOTE : STEP_LABELS_PAY;
  return (
    <div
      className="flex items-start"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={step + 1}
      aria-label="Étapes de réservation"
    >
      {labels.map((label, i) => (
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
  const [paidOk, setPaidOk] = useState(false);
  const [payNow, setPayNow] = useState(true);
  const [useMembership, setUseMembership] = useState(false);
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [dayClosed, setDayClosed] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [hours, setHours] = useState<ScheduleHour[]>([]);
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const router = useRouter();

  const service = services.find((s) => s.id === serviceId) || null;
  const onQuote = service ? isQuotedService(service.price, service.priceLabel) : false;

  useEffect(() => {
    if (onQuote) setPayNow(false);
  }, [onQuote]);

  useEffect(() => {
    function applyService(id: string) {
      setServiceId(id);
      setPlace(id === "domicile" ? "domicile" : "salon");
    }

    const stored = takeBookingService();
    const fromUrl = new URLSearchParams(window.location.search).get("service") || "";
    const picked = stored || fromUrl || "";
    if (picked) applyService(picked);
    if (fromUrl) router.replace("/rendez-vous", { scroll: false });

    function onReset() {
      applyService("");
    }
    function onPicked(event: Event) {
      const id = (event as CustomEvent<string>).detail || takeBookingService();
      applyService(id);
    }
    window.addEventListener(BOOKING_RESET_EVENT, onReset);
    window.addEventListener(BOOKING_SERVICE_EVENT, onPicked);
    return () => {
      window.removeEventListener(BOOKING_RESET_EVENT, onReset);
      window.removeEventListener(BOOKING_SERVICE_EVENT, onPicked);
    };
  }, [router]);

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
      .then((json: { name?: string; phone?: string; email?: string; membership?: MembershipInfo | null }) => {
        if (json.name || json.phone) {
          setName((current) => current || json.name || "");
          setPhone((current) => current || json.phone || "");
          setEmail((current) => current || json.email || "");
        }
        if (json.membership) {
          setMembership(json.membership);
          if (json.membership.visitsLeft > 0) {
            setUseMembership(true);
            setPayNow(false);
          }
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
      service: `${service.name} · ${useMembership && membership && membership.visitsLeft > 0 ? `Inclus · ${membership.planName}` : quotedPriceLabel(service, place)}`,
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
          payNow: onQuote || useMembership ? false : payNow,
          useMembership: Boolean(membership && membership.visitsLeft > 0 && useMembership && !onQuote),
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: string;
        invoiceId?: string;
        pendingId?: string;
        amount?: number;
        usedMembership?: boolean;
        membership?: { visitsLeft?: number; visitsTotal?: number };
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
        usedMembership: json?.usedMembership,
        visitsLeft: json?.membership?.visitsLeft,
        visitsTotal: json?.membership?.visitsTotal,
        accountCreated: json?.accountCreated,
        loginRequired: json?.loginRequired,
      });
      if (json?.usedMembership && membership) {
        const visitsLeft = Math.max(0, membership.visitsLeft - 1);
        setMembership({ ...membership, visitsLeft });
        if (visitsLeft === 0) setUseMembership(false);
      }
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
    setPaidOk(false);
    setStep(0);
    setSelected(null);
    setTime("");
    setTimeLabel("");
    setServiceId("");
    setPlace("salon");
    setError("");
    setAddress("");
    if (membership && membership.visitsLeft > 0) {
      setUseMembership(true);
      setPayNow(false);
    } else {
      setUseMembership(false);
      setPayNow(true);
    }
  }

  return (
    <div ref={box} className="scroll-mt-28 rounded-2xl bg-gray-950 p-6 stroke-gradient [--stroke-opacity:0.2] sm:p-8">
      {done ? (
        <div className="flex flex-col items-start gap-5">
          {paidOk || !done.pendingId ? <CheckCircle size={42} weight="fill" className="text-[#e0b12c]" /> : null}
          <div>
            <p className="font-bebas text-4xl text-black">
              {paidOk || done.usedMembership
                ? "Rendez-vous pris"
                : done.pendingId
                  ? "Payer pour confirmer"
                  : /sur devis/i.test(done.service)
                    ? "Demande enregistrée"
                    : done.loginRequired
                    ? "Connecte-toi pour confirmer"
                    : "Rendez-vous demandé"}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {paidOk || done.usedMembership
                ? `Merci ${done.name}. Ton rendez-vous du ${done.dateLabel} à ${done.time} est bien confirmé${done.usedMembership ? ", inclus dans ton abonnement" : ""}. On t’attend au salon.`
                : done.pendingId
                  ? `Merci ${done.name}. Dès que le paiement Wave, Orange Money ou Free Money est validé, ton rendez-vous est confirmé automatiquement.`
                  : /sur devis/i.test(done.service)
                    ? `Merci ${done.name}. Le tarif se confirme au salon, sans paiement en ligne. Un e-mail part vers ${done.email || done.phone}.`
                  : done.loginRequired
                    ? `Merci ${done.name}. Ton rendez-vous est enregistré. Connecte-toi pour le confirmer.`
                    : `Merci ${done.name}. Un e-mail de confirmation part au ${done.email || done.phone}.`}
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
            {done.usedMembership && typeof done.visitsLeft === "number" && typeof done.visitsTotal === "number" ? (
              <li className="flex justify-between gap-4">
                <span className="text-gray-500">Forfait</span>
                <span className="text-right">
                  {done.visitsLeft} / {done.visitsTotal} visite{done.visitsTotal > 1 ? "s" : ""} restante{done.visitsLeft > 1 ? "s" : ""}
                </span>
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
                kind="booking"
                hideMethods
                onPaid={() => setPaidOk(true)}
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
                kind="booking"
                hideMethods
                onPaid={() => setPaidOk(true)}
              />
            </div>
          ) : null}
          <button type="button" onClick={reset} className="btn-black h-12 w-full cursor-pointer rounded-lg text-sm font-medium">
            Prendre un autre rendez-vous
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-7">
          <StepsBar step={step} onQuote={onQuote} />

          {step === 0 ? (
            <>
              {service && !onQuote ? (
                <div>
                  <p className="text-sm font-medium text-black">Paiement du rendez-vous</p>
                  <div className={`mt-3 grid gap-2 ${membership ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}>
                    {membership ? (
                      <button
                        type="button"
                        disabled={membership.visitsLeft <= 0}
                        onClick={() => {
                          if (membership.visitsLeft <= 0) return;
                          setUseMembership(true);
                          setPayNow(false);
                        }}
                        className={`rounded-xl px-4 py-3 text-left transition-colors ${
                          membership.visitsLeft <= 0
                            ? "cursor-not-allowed bg-gray-900 text-gray-600 opacity-50 ring-1 ring-black/10"
                            : useMembership
                              ? "btn-gold cursor-pointer"
                              : "cursor-pointer bg-gray-900 text-gray-600 ring-1 ring-black/10 hover:bg-gray-800"
                        }`}
                      >
                        <span className="block text-sm font-medium">Mon abonnement</span>
                        <span className={`mt-0.5 block text-xs ${useMembership && membership.visitsLeft > 0 ? "text-black/70" : "text-gray-500"}`}>
                          {membership.visitsLeft > 0
                            ? `${membership.planName} · ${membership.visitsLeft} / ${membership.visitsTotal} visite${membership.visitsTotal > 1 ? "s" : ""}`
                            : `${membership.planName} · plus de visites`}
                        </span>
                      </button>
                    ) : null}
                    {(
                      [
                        { id: "now", label: "Payer maintenant", hint: "Wave · Orange · Free" },
                        { id: "salon", label: "Payer au salon", hint: "Espèces ou Mobile Money" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setUseMembership(false);
                          setPayNow(opt.id === "now");
                        }}
                        className={`cursor-pointer rounded-xl px-4 py-3 text-left transition-colors ${
                          !useMembership && (opt.id === "now") === payNow ? "btn-black" : "bg-gray-900 text-gray-600 ring-1 ring-black/10 hover:bg-gray-800"
                        }`}
                      >
                        <span className="block text-sm font-medium">{opt.label}</span>
                        <span className={`mt-0.5 block text-xs ${!useMembership && (opt.id === "now") === payNow ? "text-white/70" : "text-gray-500"}`}>
                          {opt.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-sm font-medium text-black">Lieu</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "salon", label: "Au salon", hint: "Nord Foire" },
                      { id: "domicile", label: "À domicile", hint: useMembership && membership && membership.visitsLeft > 0 ? "Inclus" : "+ 2 000 F" },
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
                {place === "domicile" && service && service.id !== "domicile" && !onQuote ? (
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
                  <p className="mt-2 font-medium text-black">
                    {useMembership && membership ? `Inclus · ${membership.planName}` : quotedPriceLabel(service, place)}
                  </p>
                  {useMembership && membership ? (
                    <p className="mt-1 text-xs text-gray-500">
                      1 visite déduite · {membership.visitsLeft} / {membership.visitsTotal} restante{membership.visitsLeft > 1 ? "s" : ""}
                    </p>
                  ) : onQuote ? (
                    <p className="mt-1 text-xs text-gray-500">Pas de paiement en ligne. Tarif confirmé au salon.</p>
                  ) : place === "domicile" && service.id !== "domicile" ? (
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
                  {sending
                    ? useMembership || onQuote || !payNow
                      ? "Envoi…"
                      : "Préparation du paiement…"
                    : useMembership
                      ? "Réserver avec mon abonnement"
                      : onQuote
                        ? "Demander le rendez-vous"
                        : payNow
                          ? "Réserver et payer"
                          : "Confirmer"}
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
