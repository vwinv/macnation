import type { Metadata } from "next";
import Link from "next/link";
import LegalArticle from "@/components/LegalArticle";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalArticle title="Mentions légales" subtitle="Éditeur du site, hébergement et contact.">
      <h2>Éditeur</h2>
      <p>
        Le site <Link href="/">mac-nation.vercel.app</Link> est édité par <strong className="text-gray-800">MAC NATION</strong>,
        salon de coiffure pour hommes, boutique capillaire et abonnements, situé à Nord Foire, en face du service d&apos;hygiène,
        Dakar, Sénégal.
      </p>
      <p>
        Horaires : lundi au samedi 10h-21h, dimanche 12h-20h. Pour toute question :{" "}
        <Link href="/contact">page Contact</Link> ou au salon.
      </p>
      <h2>Objet du site</h2>
      <p>
        Le site présente le salon, permet de réserver une prestation, d&apos;acheter des produits de la boutique, de souscrire un
        abonnement et de postuler. Les paiements en ligne sont réalisés via PayTech (Wave, Orange Money, Free Money).
      </p>
      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 440 Terry Avenue North, San Francisco, CA 94158, États-Unis.
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>
        Textes, photos, logo, charte graphique et contenus MAC NATION sont protégés. Toute reproduction non autorisée est
        interdite.
      </p>
      <h2>Documents liés</h2>
      <p>
        <Link href="/cgu">CGU</Link> · <Link href="/cgv">CGV</Link> ·{" "}
        <Link href="/privacy">Politique de confidentialité</Link> · <Link href="/retours">Retours & remboursements</Link> ·{" "}
        <Link href="/envois">Politique d&apos;envois</Link>
      </p>
    </LegalArticle>
  );
}
