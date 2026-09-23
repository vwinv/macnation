"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";
import { CartProvider } from "@/components/CartProvider";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/payer") || pathname.startsWith("/paiement")) return children;
  return (
    <CartProvider>
      <Preloader />
      <Header />
      {children}
      <Footer />
    </CartProvider>
  );
}
