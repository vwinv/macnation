"use client";

import { useEffect } from "react";
import { writeCart } from "@/lib/cart";

export default function ClearCartOnPaid({ paid, kind }: { paid: boolean; kind?: string }) {
  useEffect(() => {
    if (paid && kind === "boutique") writeCart([]);
  }, [paid, kind]);
  return null;
}
