"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import { navLinks } from "@/lib/assets";
import AccountNav from "@/components/AccountNav";
import ReserveLink from "@/components/ReserveLink";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-5 z-50 w-full px-4 sm:px-8 lg:left-1/2 lg:w-auto lg:-translate-x-1/2 lg:px-0">
      <nav
        aria-label="Main"
        className="relative mx-auto flex h-full flex-col rounded-[19px] bg-black ring-1 ring-white/15 lg:flex-row"
      >
        <div className="flex w-full items-center justify-between gap-3 p-4 sm:gap-5">
          <Link href="/" aria-label="Go to home" className="relative w-12 px-3 lg:w-15">
            <Image src="/logo-square.svg" alt="MAC NATION" width={30} height={30} />
          </Link>
          <ul
            className={`hidden flex-2 items-center gap-4 px-8 lg:flex ${
              ready ? "opacity-100 scale-y-100" : "opacity-0 scale-y-[0.96]"
            } origin-center transition-all duration-500`}
          >
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href} className="relative flex h-full items-center justify-center">
                  <Link
                    href={link.href}
                    className={`whitespace-nowrap p-3 text-sm tracking-wide transition-all duration-300 hover:scale-[1.03] hover:text-white ${
                      active ? "text-white" : "text-white/55"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <AccountNav className="relative hidden whitespace-nowrap p-3 text-sm tracking-wide text-white/55 transition-all duration-300 hover:scale-[1.03] hover:text-white sm:block" />
          <Link
            href="/#equipe"
            className="btn-black relative hidden h-10 items-center justify-center rounded-lg px-4 text-[14px] font-medium transition-all duration-300 active:scale-[0.98] sm:inline-flex"
          >
            Candidater
          </Link>
          <ReserveLink className="btn-gold relative inline-flex h-10 cursor-pointer items-center justify-center rounded-lg px-5 text-[14px] font-medium transition-all duration-300 active:scale-[0.98] sm:px-8">
            Réserver
          </ReserveLink>
          <button
            type="button"
            aria-label={open ? "Fermer le menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white ring-1 ring-white/20 transition-all duration-300 lg:hidden"
          >
            {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
          </button>
        </div>
        {open ? (
          <ul className="flex flex-col gap-1 px-6 pb-6 lg:hidden">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-3 text-sm text-white transition-colors hover:bg-white/10"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <AccountNav className="block rounded-lg px-3 py-3 text-sm text-white transition-colors hover:bg-white/10" />
            </li>
            <li>
              <Link
                href="/#equipe"
                className="btn-gold mt-2 flex h-11 items-center justify-center rounded-lg text-sm font-medium"
              >
                Candidater
              </Link>
            </li>
          </ul>
        ) : null}
      </nav>
    </header>
  );
}
