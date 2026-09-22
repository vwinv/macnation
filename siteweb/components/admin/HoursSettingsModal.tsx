"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const WEEKDAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;

type HourRow = {
  weekday: number;
  closed: boolean;
  openTime: string;
  closeTime: string;
  pauseStart?: string | null;
  pauseEnd?: string | null;
};

type ClosedDate = {
  id: string;
  dateIso: string;
  note: string;
};

function sortHours(hours: HourRow[]) {
  return [...hours].sort((a, b) => WEEKDAY_ORDER.indexOf(a.weekday as (typeof WEEKDAY_ORDER)[number]) - WEEKDAY_ORDER.indexOf(b.weekday as (typeof WEEKDAY_ORDER)[number]));
}

export default function HoursSettingsModal({ onClose }: { onClose: () => void }) {
  const [hours, setHours] = useState<HourRow[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [dateIso, setDateIso] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/schedule", { cache: "no-store" });
    const json = (await res.json()) as { hours?: HourRow[]; closedDates?: ClosedDate[]; error?: string };
    if (!res.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    setHours(sortHours(json.hours || []));
    setClosedDates(json.closedDates || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateHour(weekday: number, patch: Partial<HourRow>) {
    setHours((current) => current.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)));
  }

  async function saveHours(e: FormEvent) {
    e.preventDefault();
    setBusy("hours");
    setError("");
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      const json = (await res.json()) as { hours?: HourRow[]; closedDates?: ClosedDate[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible.");
      setHours(sortHours(json.hours || hours));
      if (json.closedDates) setClosedDates(json.closedDates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy("");
    }
  }

  async function addClosed(e: FormEvent) {
    e.preventDefault();
    if (!dateIso) return;
    setBusy("closed");
    setError("");
    try {
      const res = await fetch("/api/admin/closed-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateIso, note }),
      });
      const json = (await res.json()) as { closedDates?: ClosedDate[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Ajout impossible.");
      setClosedDates(json.closedDates || []);
      setDateIso("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ajout impossible.");
    } finally {
      setBusy("");
    }
  }

  async function removeClosed(id: string) {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/closed-dates/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { closedDates?: ClosedDate[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Suppression impossible.");
      setClosedDates(json.closedDates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] text-[#e0b12c]">BOUTIQUE</p>
            <h2 className="font-bebas mt-1 text-3xl text-black">Paramétrages</h2>
          </div>
          <button type="button" onClick={onClose} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black">
            Fermer
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <form onSubmit={saveHours} className="mt-6">
          <p className="text-sm font-medium text-black">Jours et heures d’ouverture</p>
          <p className="mt-1 text-xs text-gray-500">Tu peux indiquer une pause (déjeuner, coupure) : aucun rendez-vous ne sera proposé sur ce créneau.</p>
          <ul className="mt-3 space-y-2">
            {hours.map((row) => {
              const hasPause = Boolean(row.pauseStart && row.pauseEnd);
              return (
                <li key={row.weekday} className="rounded-xl bg-gray-900 px-3 py-3 ring-1 ring-black/10">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-black">{WEEKDAY_LABELS[row.weekday]}</span>
                    <label className="flex items-center gap-2 text-xs text-gray-400">
                      <input
                        type="checkbox"
                        checked={row.closed}
                        onChange={(e) => updateHour(row.weekday, { closed: e.target.checked })}
                      />
                      Fermé
                    </label>
                  </div>
                  {row.closed ? null : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs text-gray-500">
                        Ouverture
                        <span className="mt-1 flex gap-2">
                          <input
                            type="time"
                            value={row.openTime}
                            onChange={(e) => updateHour(row.weekday, { openTime: e.target.value })}
                            className="h-9 w-full rounded-lg bg-gray-100 px-2 text-sm text-black outline-none ring-1 ring-black/10"
                          />
                          <input
                            type="time"
                            value={row.closeTime}
                            onChange={(e) => updateHour(row.weekday, { closeTime: e.target.value })}
                            className="h-9 w-full rounded-lg bg-gray-100 px-2 text-sm text-black outline-none ring-1 ring-black/10"
                          />
                        </span>
                      </label>
                      <div>
                        <label className="flex items-center gap-2 text-xs text-gray-400">
                          <input
                            type="checkbox"
                            checked={hasPause}
                            onChange={(e) =>
                              updateHour(
                                row.weekday,
                                e.target.checked
                                  ? { pauseStart: row.pauseStart || "13:00", pauseEnd: row.pauseEnd || "14:00" }
                                  : { pauseStart: "", pauseEnd: "" },
                              )
                            }
                          />
                          Pause
                        </label>
                        <span className="mt-1 flex gap-2">
                          <input
                            type="time"
                            value={row.pauseStart || "13:00"}
                            disabled={!hasPause}
                            onChange={(e) => updateHour(row.weekday, { pauseStart: e.target.value })}
                            className="h-9 w-full rounded-lg bg-gray-100 px-2 text-sm text-black outline-none ring-1 ring-black/10 disabled:opacity-40"
                          />
                          <input
                            type="time"
                            value={row.pauseEnd || "14:00"}
                            disabled={!hasPause}
                            onChange={(e) => updateHour(row.weekday, { pauseEnd: e.target.value })}
                            className="h-9 w-full rounded-lg bg-gray-100 px-2 text-sm text-black outline-none ring-1 ring-black/10 disabled:opacity-40"
                          />
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <button type="submit" disabled={busy === "hours"} className="btn-gold mt-4 h-10 cursor-pointer rounded-lg px-4 text-sm font-medium disabled:opacity-50">
            {busy === "hours" ? "Enregistrement…" : "Enregistrer les horaires"}
          </button>
        </form>

        <form onSubmit={addClosed} className="mt-8 border-t border-black/10 pt-6">
          <p className="text-sm font-medium text-black">Fermeture à une date précise</p>
          <p className="mt-1 text-xs text-gray-500">Jour férié, absence, événement… aucun rendez-vous ne sera proposé ce jour-là.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="date"
              value={dateIso}
              onChange={(e) => setDateIso(e.target.value)}
              className="h-10 rounded-lg bg-gray-900 px-3 text-sm text-black outline-none ring-1 ring-black/10"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optionnel)"
              className="h-10 rounded-lg bg-gray-900 px-3 text-sm text-black outline-none ring-1 ring-black/10"
            />
            <button type="submit" disabled={!dateIso || busy === "closed"} className="h-10 cursor-pointer rounded-lg bg-gray-800 px-4 text-sm text-black ring-1 ring-black/10 disabled:opacity-50">
              Ajouter
            </button>
          </div>
        </form>

        <ul className="mt-4 space-y-2">
          {closedDates.length === 0 ? (
            <li className="text-sm text-gray-500">Aucune fermeture exceptionnelle.</li>
          ) : (
            closedDates.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-900 px-3 py-2 ring-1 ring-black/10">
                <div>
                  <p className="text-sm text-black">{item.dateIso}</p>
                  {item.note ? <p className="text-xs text-gray-500">{item.note}</p> : null}
                </div>
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => void removeClosed(item.id)}
                  className="h-8 cursor-pointer rounded-lg px-3 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Retirer
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
