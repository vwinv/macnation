"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Agenda" },
  { href: "/admin/services", label: "Catalogue" },
  { href: "/admin/factures", label: "Factures" },
  { href: "/admin/paiements", label: "Paiements" },
  { href: "/admin/caisse", label: "Caisse" },
  { href: "/admin/compta", label: "Compta" },
  { href: "/admin/candidatures", label: "Candidatures" },
  { href: "/admin/clients", label: "Clients" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/admin/login") return null;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link href="/admin" className="text-xs tracking-[0.22em] text-[#e0b12c]">
          MAC NATION
        </Link>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  active ? "bg-[#e0b12c] text-black" : "text-gray-400 hover:bg-black/5 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" onClick={() => void logout()} className="cursor-pointer text-sm text-gray-500 hover:text-black">
          Déconnexion
        </button>
      </div>
    </header>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-gold no-print h-10 cursor-pointer rounded-lg px-4 text-sm font-medium">
      Imprimer
    </button>
  );
}
