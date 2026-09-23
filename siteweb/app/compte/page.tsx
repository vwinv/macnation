"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilSimple } from "@phosphor-icons/react";
import type { LoyaltyEvent, Membership, PublicClient } from "@/lib/salon-types";
import { formatFcfa } from "@/lib/money";
import BookingsPopup from "@/components/BookingsPopup";
import OrdersPopup from "@/components/OrdersPopup";
import ProfilePopup from "@/components/ProfilePopup";

type Dashboard = {
  client: PublicClient;
  membership: Membership | null;
  memberships: Membership[];
  loyalty: LoyaltyEvent[];
  redeemPoints: number;
  redeemFcfa: number;
};

function dateFr(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(iso: string) {
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return 0;
  const today = new Date();
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const finish = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((finish - start) / 86_400_000);
}

export default function ComptePage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

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

  async function logout() {
    await fetch("/api/compte/logout", { method: "POST" });
    router.replace("/compte/login");
    router.refresh();
  }

  async function redeem() {
    setBusy("redeem");
    setError("");
    try {
      const res = await fetch("/api/compte/redeem", { method: "POST" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Échange impossible.");
        return;
      }
      await load();
    } finally {
      setBusy("");
    }
  }

  async function cancelMembership() {
    if (!window.confirm("Arrêter l'abonnement en cours ? Les visites restantes ne seront plus utilisables.")) return;
    setBusy("abo");
    setError("");
    try {
      const res = await fetch("/api/compte/membership", { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Impossible d'arrêter l'abonnement.");
        return;
      }
      await load();
    } finally {
      setBusy("");
    }
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-5xl px-6 pt-32 pb-20">
        <p className="text-sm text-gray-500">{error || "Chargement de ton espace…"}</p>
      </main>
    );
  }

  const { client, membership } = data;
  const visitsLeft = membership ? Math.max(0, membership.visitsTotal - membership.visitsUsed) : 0;
  const daysLeft = membership ? daysUntil(membership.expiresAt) : 0;
  const showRenew = Boolean(membership && (visitsLeft <= 1 || daysLeft <= 5));

  return (
    <main className="mx-auto max-w-5xl px-6 pt-32 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.22em] text-[#e0b12c]">ESPACE CLIENT</p>
          <h1 className="font-bebas mt-2 flex items-center gap-3 text-5xl text-black sm:text-6xl">
            Salut {client.name.split(" ")[0]}
            <button
              type="button"
              aria-label="Modifier le profil"
              onClick={() => setProfileOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-gray-900 text-black ring-1 ring-black/10 hover:bg-gray-800"
            >
              <PencilSimple size={18} weight="bold" />
            </button>
          </h1>
          <p className="mt-2 text-sm text-gray-400">{client.phone || client.email}</p>
        </div>
        <button type="button" onClick={() => void logout()} className="cursor-pointer text-sm text-gray-500 hover:text-black">
          Déconnexion
        </button>
      </div>

      {!client.phone || client.hasPassword === false ? (
        <p className="mt-6 rounded-lg bg-[#e0b12c]/15 px-4 py-3 text-sm text-[#e0b12c]">
          {!client.phone
            ? "Ajoute un numéro sénégalais dans le profil pour réserver, payer et lier tes points. "
            : "Choisis un mot de passe dans le profil pour te reconnecter sans Google / Apple / Facebook. "}
          <button type="button" onClick={() => setProfileOpen(true)} className="underline hover:text-black">
            Compléter le profil
          </button>
        </p>
      ) : null}

      {error ? <p className="mt-6 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-2xl bg-gray-950 p-6 ring-1 ring-black/10">
          <p className="text-xs tracking-[0.18em] text-[#e0b12c]">FIDÉLITÉ</p>
          <p className="font-bebas mt-3 text-5xl text-black">{client.points}</p>
          <p className="text-sm text-gray-500">points</p>
          <button
            type="button"
            disabled={!client.phone || client.points < data.redeemPoints || busy === "redeem"}
            onClick={() => void redeem()}
            className="btn-gold mt-5 h-11 w-full cursor-pointer rounded-lg text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "redeem" ? "Échange…" : `Échanger ${data.redeemPoints} pts · ${formatFcfa(data.redeemFcfa)}`}
          </button>
        </article>
        <article className="rounded-2xl bg-gray-950 p-6 ring-1 ring-black/10">
          <p className="text-xs tracking-[0.18em] text-[#e0b12c]">CRÉDIT SALON</p>
          <p className="font-bebas mt-3 text-5xl text-black">{formatFcfa(client.creditFcfa)}</p>
          <p className="mt-2 text-sm text-gray-500">À déduire à la caisse, Nord Foire.</p>
        </article>
        <article className="rounded-2xl bg-gray-950 p-6 ring-1 ring-black/10">
          <p className="text-xs tracking-[0.18em] text-[#e0b12c]">ABONNEMENT</p>
          {membership ? (
            <>
              <p className="font-bebas mt-3 text-4xl text-black">{membership.planName}</p>
              <p className="mt-2 text-sm text-gray-400">
                {visitsLeft} / {membership.visitsTotal} visite{membership.visitsTotal > 1 ? "s" : ""} restante{visitsLeft > 1 ? "s" : ""} · jusqu&apos;au {dateFr(membership.expiresAt)}
              </p>
              <p className="mt-1 text-xs text-gray-500">{membership.boutiquePercent}% sur la boutique</p>
            </>
          ) : (
            <>
              <p className="font-bebas mt-3 text-4xl text-black">Aucun</p>
              <p className="mt-2 text-sm text-gray-500">Prends un forfait pour tes visites du mois.</p>
            </>
          )}
          {membership && visitsLeft > 0 ? (
            <Link
              href="/rendez-vous"
              className="btn-black mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium"
            >
              Prendre RDV · {visitsLeft} dispo
            </Link>
          ) : membership && showRenew ? (
            <p className="mt-5 text-xs text-gray-500">Forfait épuisé. Renouvelle pour reprendre un RDV inclus.</p>
          ) : null}
          {showRenew || !membership ? (
            <Link
              href={membership ? `/abonnements/payer/${membership.planId}` : "/abonnements"}
              className={`${membership && visitsLeft > 0 ? "btn-black mt-2" : "btn-black mt-5"} inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium`}
            >
              {membership ? "Renouveler" : "Voir les abonnements"}
            </Link>
          ) : null}
          {membership ? (
            <button
              type="button"
              disabled={busy === "abo"}
              onClick={() => void cancelMembership()}
              className="mt-2 h-10 w-full cursor-pointer text-xs text-gray-500 hover:text-black disabled:opacity-50"
            >
              Arrêter l&apos;abonnement
            </button>
          ) : null}
        </article>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setBookingsOpen(true)}
          className="btn-black flex h-20 items-center justify-center rounded-2xl text-base font-medium sm:h-24 sm:text-lg"
        >
          Mes Rendez-vous
        </button>
        <button
          type="button"
          onClick={() => setOrdersOpen(true)}
          className="btn-gold flex h-20 items-center justify-center rounded-2xl text-base font-medium sm:h-24 sm:text-lg"
        >
          Mes commandes
        </button>
      </div>

      <section className="mt-12">
        <h2 className="font-bebas text-3xl text-black">Mouvements points</h2>
        {data.loyalty.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Tes points apparaissent dès le premier paiement.</p>
        ) : (
          <ul className="mt-4 divide-y divide-black/10 rounded-2xl bg-gray-950 ring-1 ring-black/10">
            {data.loyalty.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-gray-400">
                  {dateFr(item.createdAt)} · {item.label}
                </span>
                <span className={item.points >= 0 ? "text-[#e0b12c]" : "text-gray-600"}>
                  {item.points > 0 ? "+" : ""}
                  {item.points} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProfilePopup
        open={profileOpen}
        client={client}
        onClose={() => setProfileOpen(false)}
        onSaved={load}
      />
      <BookingsPopup open={bookingsOpen} onClose={() => setBookingsOpen(false)} />
      <OrdersPopup open={ordersOpen} onClose={() => setOrdersOpen(false)} />
    </main>
  );
}
