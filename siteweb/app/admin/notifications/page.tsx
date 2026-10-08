"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicClient } from "@/lib/salon-types";

type Campaign = {
  id: string;
  createdAt: string;
  title: string;
  body: string;
  kind: string;
  audience: string;
  sentCount: number;
  failCount: number;
  clientIds: string[];
};

const field =
  "h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50";
const area =
  "rounded-lg bg-gray-900 px-3 py-2 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50";

function kindLabel(kind: string) {
  switch (kind) {
    case "general":
      return "Générale";
    case "targeted":
      return "Ciblée";
    case "article":
      return "Journal";
    case "booking_eve":
      return "Rappel veille";
    case "booking_day":
      return "Rappel jour J";
    default:
      return kind;
  }
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<PublicClient[]>([]);
  const [devices, setDevices] = useState(0);
  const [configured, setConfigured] = useState(false);
  const [audience, setAudience] = useState<"general" | "targeted">("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<PublicClient[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pushRes, clientsRes] = await Promise.all([
        fetch("/api/admin/push", { cache: "no-store" }),
        fetch("/api/admin/clients", { cache: "no-store" }),
      ]);
      if (pushRes.status === 401 || clientsRes.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const pushJson = (await pushRes.json()) as {
        campaigns?: Campaign[];
        devices?: number;
        configured?: boolean;
        error?: string;
      };
      const clientsJson = (await clientsRes.json()) as { clients?: PublicClient[] };
      if (!pushRes.ok) {
        setError(pushJson.error || "Chargement impossible.");
        return;
      }
      setCampaigns(pushJson.campaigns || []);
      setDevices(pushJson.devices || 0);
      setConfigured(Boolean(pushJson.configured));
      setClients(clientsJson.clients || []);
    } catch {
      setError("Chargement impossible.");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const digits = q.replace(/\D/g, "");
    const selected = new Set(picked.map((item) => item.id));
    return clients
      .filter((item) => !selected.has(item.id))
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          (digits.length >= 2 && item.phone.replace(/\D/g, "").includes(digits)),
      )
      .slice(0, 6);
  }, [clients, picked, query]);

  function addClient(client: PublicClient) {
    setPicked((current) => [...current, client]);
    setQuery("");
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          audience,
          clientIds: picked.map((item) => item.id),
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string; campaign?: Campaign } | null;
      if (!res.ok) {
        setError(json?.error || "Envoi impossible.");
        return;
      }
      setTitle("");
      setBody("");
      setPicked([]);
      setSaved(
        audience === "general"
          ? "Notification générale envoyée."
          : "Notification ciblée envoyée.",
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function runReminders() {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const res = await fetch("/api/admin/push/reminders", { method: "POST" });
      const json = (await res.json().catch(() => null)) as {
        error?: string;
        eve?: number;
        day?: number;
      } | null;
      if (!res.ok) {
        setError(json?.error || "Rappels impossibles.");
        return;
      }
      setSaved(`Rappels envoyés : ${json?.eve ?? 0} veille, ${json?.day ?? 0} jour J.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-8 sm:px-8">
      <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
      <h1 className="font-bebas mt-2 text-5xl text-black">Notifications</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-400">
        Push sur l’app : générales (tous les téléphones) ou ciblées (un ou plusieurs clients). Les rappels de
        RDV partent seuls la veille et le jour J à 9h. Un nouvel article du journal prévient tout le monde.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10">
          <p className="text-xs text-gray-400">Appareils enregistrés</p>
          <p className="font-bebas mt-1 text-4xl text-black">{devices}</p>
        </div>
        <div className="rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10">
          <p className="text-xs text-gray-400">Firebase</p>
          <p className="font-bebas mt-1 text-4xl text-black">{configured ? "Prêt" : "À configurer"}</p>
          {configured ? null : (
            <p className="mt-2 text-xs text-gray-400">
              Ajoute FIREBASE_SERVICE_ACCOUNT dans l’API pour vraiment envoyer les push.
            </p>
          )}
        </div>
      </div>

      {error ? <p className="mt-6 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
      {saved ? <p className="mt-6 rounded-lg bg-emerald-500/15 px-4 py-3 text-sm text-emerald-700">{saved}</p> : null}

      <form onSubmit={(e) => void send(e)} className="mt-8 rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6">
        <h2 className="font-bebas text-3xl text-black">Nouvelle notification</h2>
        <div className="mt-5 grid gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAudience("general")}
              className={`h-10 cursor-pointer rounded-lg px-4 text-sm ${audience === "general" ? "btn-gold" : "bg-gray-900 text-gray-400 ring-1 ring-black/10 hover:text-black"}`}
            >
              Générale
            </button>
            <button
              type="button"
              onClick={() => setAudience("targeted")}
              className={`h-10 cursor-pointer rounded-lg px-4 text-sm ${audience === "targeted" ? "btn-gold" : "bg-gray-900 text-gray-400 ring-1 ring-black/10 hover:text-black"}`}
            >
              Ciblée
            </button>
          </div>
          {audience === "targeted" ? (
            <div>
              <p className="text-sm text-black">Clients</p>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom ou téléphone"
                className={`${field} mt-2 w-full`}
              />
              {results.length ? (
                <ul className="mt-2 overflow-hidden rounded-xl ring-1 ring-black/10">
                  {results.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => addClient(item)}
                        className="flex w-full cursor-pointer items-center justify-between bg-gray-900 px-3 py-2.5 text-left hover:bg-gray-200"
                      >
                        <span className="text-sm text-black">{item.name}</span>
                        <span className="text-xs text-gray-400">{item.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {picked.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {picked.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPicked((current) => current.filter((row) => row.id !== item.id))}
                      className="cursor-pointer rounded-full bg-black px-3 py-1 text-xs text-white"
                    >
                      {item.name} ×
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-400">Ajoute au moins un client.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Tous les téléphones qui ont ouvert l’app recevront le message.</p>
          )}
          <label className="flex flex-col gap-2 text-sm text-black">
            Titre
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} required />
          </label>
          <label className="flex flex-col gap-2 text-sm text-black">
            Texte
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className={area} required />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className="btn-gold h-11 w-fit cursor-pointer rounded-lg px-6 text-sm font-medium disabled:opacity-50">
              {busy ? "Envoi…" : "Envoyer"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runReminders()}
              className="h-11 cursor-pointer rounded-lg bg-gray-900 px-4 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200 disabled:opacity-50"
            >
              Lancer les rappels RDV
            </button>
          </div>
        </div>
      </form>

      <section className="mt-10">
        <h2 className="font-bebas text-3xl text-black">Historique</h2>
        {campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">Aucune notification envoyée pour le moment.</p>
        ) : (
          <ul className="mt-4 divide-y divide-black/10 rounded-2xl bg-gray-950 ring-1 ring-black/10">
            {campaigns.map((item) => (
              <li key={item.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-black">{item.title}</p>
                  <p className="text-xs text-gray-400">
                    {kindLabel(item.kind)} · {item.sentCount} envoyée{item.sentCount > 1 ? "s" : ""}
                    {item.failCount ? ` · ${item.failCount} échec${item.failCount > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
                <p className="mt-1 text-sm text-gray-400">{item.body}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
