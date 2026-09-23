import type { Metadata } from "next";
import CartCheckout from "@/components/CartCheckout";

export const metadata: Metadata = {
  title: "Commander",
};

export default function BoutiqueCommanderPage() {
  return <CartCheckout />;
}
