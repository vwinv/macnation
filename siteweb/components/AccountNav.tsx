"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AccountNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [label, setLabel] = useState("Compte");
  const [href, setHref] = useState("/compte/login");

  useEffect(() => {
    let live = true;
    fetch("/api/compte/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { name?: string }) => {
        if (!live) return;
        if (json.name) {
          setLabel("Mon compte");
          setHref("/compte");
        } else {
          setLabel("Compte");
          setHref("/compte/login");
        }
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [pathname]);

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
