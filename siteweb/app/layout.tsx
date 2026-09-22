import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import SiteChrome from "@/components/SiteChrome";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "MAC NATION | Barbershop et Boutique capillaire à Dakar",
    template: "%s | MAC NATION",
  },
  description:
    "MAC NATION, barbershop pour hommes à Dakar. Nord Foire, en face du service d'hygiène. Coupe, barbe, boutique capillaire et abonnements. Tous types de cheveux.",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={poppins.variable} suppressHydrationWarning>
      <body className={`${poppins.className} font-sans bg-background p-0 antialiased`} suppressHydrationWarning>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
