"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicClient } from "@/lib/salon-types";

export type PickedClient = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

function matches(client: PublicClient, query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return false;
  const digits = q.replace(/\D/g, "");
  return (
    client.name.toLowerCase().includes(q) ||
    client.email.toLowerCase().includes(q) ||
    (digits.length >= 2 && client.phone.replace(/\D/g, "").includes(digits))
  );
}

export default function AdminClientPicker({
  value,
  onChange,
}: {
  value: PickedClient | null;
  onChange: (client: PickedClient | null) => void;
}) {
  const [clients, setClients] = useState<PublicClient[]>([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/admin/clients", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { clients?: PublicClient[] }) => setClients(json.clients || []))
      .catch(() => setClients([]));
  }, []);

  const searching = query.trim().length >= 2;
  const results = useMemo(
    () => (searching ? clients.filter((item) => matches(item, query)).slice(0, 5) : []),
    [clients, query, searching],
  );
  const noMatch = searching && results.length === 0;

  function pick(item: PublicClient | PickedClient) {
    onChange({ id: item.id, name: item.name, phone: item.phone, email: item.email || "" });
    setQuery("");
    setError("");
    setNotice("");
  }

  async function createClient() {
    setError("");
    setNotice("");
    setSending(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });
      const json = (await res.json()) as { client?: PublicClient; created?: boolean; error?: string; message?: string };
      if (!res.ok || !json.client) {
        setError(json.error || json.message || "Création impossible.");
        return;
      }
      setClients((current) => [json.client!, ...current.filter((item) => item.id !== json.client!.id)]);
      pick(json.client);
      setName("");
      setPhone("");
      setEmail("");
      setNotice(
        json.created
          ? "Compte créé. Un mail et un SMS ont été envoyés avec les accès."
          : "Ce numéro a déjà un compte. Client sélectionné.",
      );
    } finally {
      setSending(false);
    }
  }

  if (value) {
    return (
      <div className="rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-black/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.16em] text-[#e0b12c]">CLIENT</p>
            <p className="mt-1 truncate text-sm text-black">{value.name}</p>
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {value.phone}
              {value.email ? ` · ${value.email}` : ""}
            </p>
            {notice ? <p className="mt-2 text-xs text-emerald-700">{notice}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setNotice("");
            }}
            className="h-8 shrink-0 cursor-pointer rounded-lg px-2 text-sm text-gray-500 hover:bg-black/5 hover:text-black"
          >
            Changer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="flex flex-col gap-2 text-sm text-gray-800">
        Rechercher un client
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tape un nom, un téléphone ou un email"
          className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
        />
      </label>

      {results.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-xl ring-1 ring-black/10">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => pick(item)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 bg-gray-900 px-3 py-2.5 text-left hover:bg-gray-200"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-black">{item.name}</span>
                  <span className="block truncate text-xs text-gray-500">
                    {item.phone}
                    {item.email ? ` · ${item.email}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-[#e0b12c]">Choisir</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {noMatch ? <p className="mt-2 text-sm text-gray-500">Aucun client trouvé. Crée le compte ci-dessous.</p> : null}

      <div className="mt-4 rounded-xl bg-gray-900 p-4 ring-1 ring-black/10">
        <p className="text-sm text-gray-800">Nouveau client</p>
        <p className="mt-1 text-xs text-gray-500">Un mail et un SMS seront envoyés avec le téléphone et le mot de passe.</p>
        <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
          Nom *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-lg bg-gray-950 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
          />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-gray-800">
            Téléphone *
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-lg bg-gray-950 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-gray-800">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg bg-gray-950 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
            />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          disabled={sending || !name.trim() || !phone.trim()}
          onClick={() => void createClient()}
          className="mt-3 h-10 w-full cursor-pointer rounded-lg bg-black text-sm text-white disabled:opacity-50"
        >
          {sending ? "Création…" : "Créer le client et envoyer les accès"}
        </button>
      </div>
    </div>
  );
}
