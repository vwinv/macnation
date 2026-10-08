"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";

const LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/abonnements", label: "Abonnements" },
  { href: "/admin/services", label: "Catalogue" },
  { href: "/admin/contenu", label: "Contenu du site" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/factures", label: "Factures" },
  { href: "/admin/paiements", label: "Paiements" },
  { href: "/admin/caisse", label: "Caisse" },
  { href: "/admin/compta", label: "Compta" },
  { href: "/admin/clients", label: "Clients" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") return null;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const links = LINKS.map((item) => {
    const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`rounded-lg px-3 py-2.5 text-sm ${
          active ? "bg-black text-white" : "text-gray-500 hover:bg-black/5 hover:text-black"
        }`}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 no-print md:hidden">
        <Link href="/admin" aria-label="MAC NATION" className="inline-flex items-center">
          <Logo className="h-12 w-28 dark:invert" onLight />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle tone="onSurface" />
          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5"
          >
            <List size={20} />
          </button>
        </div>
      </div>
      {open ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-black/25 no-print md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-black/10 bg-white no-print transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative px-5 pb-2 pt-8">
          <Link href="/admin" aria-label="MAC NATION" className="flex justify-center">
            <Logo className="h-16 w-40 dark:invert" onLight />
          </Link>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5 md:hidden"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1 px-3">{links}</nav>
        <div className="px-3 pb-2">
          <ThemeToggle variant="pills" />
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="cursor-pointer px-5 py-4 text-left text-sm text-gray-500 hover:text-black"
        >
          Déconnexion
        </button>
      </aside>
    </>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-gold no-print h-10 cursor-pointer rounded-lg px-4 text-sm font-medium">
      Imprimer
    </button>
  );
}
