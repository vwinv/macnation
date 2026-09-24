"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Booking } from "@/lib/salon-types";
import { formatFcfa, type PaymentMethod } from "@/lib/money";
import AdminClientPicker, { type PickedClient } from "@/components/admin/AdminClientPicker";

type Service = { id: string; name: string; duration: string; price: number | null; priceLabel: string | null };
type Slot = { time: string; label: string; available: boolean };

const PAY: { id: "" | PaymentMethod; label: string }[] = [
  { id: "", label: "Plus tard" },
  { id: "especes", label: "Espèces" },
  { id: "wave", label: "Wave" },
  { id: "orange", label: "Orange Money" },
  { id: "free", label: "Free Money" },
];

function servicePrice(item: Service) {
  if (item.priceLabel) return item.priceLabel;
  if (item.price == null) return "Sur devis";
  return formatFcfa(item.price);
}

export default function AdminWalkInBooking({
  dateIso,
  onClose,
  onCreated,
}: {
  dateIso: string;
  onClose: () => void;
  onCreated: (booking: Booking) => void;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [client, setClient] = useState<PickedClient | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(dateIso);
  const [time, setTime] = useState("");
  const [payNow, setPayNow] = useState<"" | PaymentMethod>("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/catalog/services", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: Service[] | { services?: Service[] }) => {
        const list = Array.isArray(json) ? json : json.services || [];
        setServices(list);
        if (list[0]) setServiceId(list[0].id);
      })
      .catch(() => setError("Catalogue introuvable."));
  }, []);

  useEffect(() => {
    if (!date || !serviceId) {
      setSlots([]);
      return;
    }
    const query = new URLSearchParams({ date, service: serviceId });
    fetch(`/api/admin/bookings/slots?${query}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { slots?: Slot[]; error?: string; reason?: string; closed?: boolean }) => {
        if (json.closed) {
          setSlots([]);
          setTime("");
          return;
        }
        const next = json.slots || [];
        setSlots(next);
        setTime((current) => (next.some((slot) => slot.available && slot.time === current) ? current : next.find((slot) => slot.available)?.time || ""));
      })
      .catch(() => setSlots([]));
  }, [date, serviceId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!client) {
      setError("Choisis ou crée un client.");
      return;
    }
    if (!time) {
      setError("Choisis un créneau.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client.name,
          phone: client.phone,
          email: client.email,
          clientId: client.id,
          serviceId,
          dateIso: date,
          time,
          paymentMethod: payNow || undefined,
        }),
      });
      const json = (await res.json()) as { booking?: Booking; error?: string; message?: string };
      if (!res.ok || !json.booking) {
        setError(json.error || json.message || "Création impossible.");
        return;
      }
      onCreated(json.booking);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <form
        onSubmit={(e) => void onSubmit(e)}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] text-[#e0b12c]">SALON</p>
            <h2 className="font-bebas mt-1 text-3xl text-black">Nouveau RDV</h2>
            <p className="mt-1 text-sm text-gray-500">Client qui passe directement au salon.</p>
          </div>
          <button type="button" onClick={onClose} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black">
            Fermer
          </button>
        </div>

        <div className="mt-5">
          <AdminClientPicker value={client} onChange={setClient} />
        </div>
        <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
          Prestation
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
            className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10"
          >
            {services.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.duration} · {servicePrice(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10"
          />
        </label>
        <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
          Créneau
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10"
          >
            {slots.filter((slot) => slot.available).length === 0 ? <option value="">Aucun créneau libre</option> : null}
            {slots
              .filter((slot) => slot.available)
              .map((slot) => (
                <option key={slot.time} value={slot.time}>
                  {slot.label}
                </option>
              ))}
          </select>
        </label>
        <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
          Paiement
          <select
            value={payNow}
            onChange={(e) => setPayNow(e.target.value as "" | PaymentMethod)}
            className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10"
          >
            {PAY.map((item) => (
              <option key={item.id || "later"} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <button type="submit" disabled={sending} className="btn-gold mt-5 h-11 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70">
          {sending ? "Enregistrement…" : "Créer le RDV"}
        </button>
      </form>
    </div>
  );
}
