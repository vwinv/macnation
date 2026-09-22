import type { Metadata } from "next";
import Link from "next/link";
import LegalArticle from "@/components/LegalArticle";

export const metadata: Metadata = { title: "Conditions générales de vente" };

export default function CgvPage() {
  return (
    <LegalArticle title="CGV" subtitle="Conditions générales de vente. Salon, boutique et abonnements.">
      <h2>Champ d&apos;application</h2>
      <p>
        Les présentes CGV s&apos;appliquent aux prestations de coiffure, à la boutique capillaire et aux abonnements vendus
        par MAC NATION, Nord Foire, Dakar, sur le site ou au salon.
      </p>
      <h2>Prix</h2>
      <p>
        Les tarifs sont indiqués en francs CFA. Ils peuvent changer. Le prix dû est celui affiché au moment de la
        commande ou de la réservation. Un supplément de 2 000 F s&apos;applique pour une prestation à domicile à Dakar.
      </p>
      <h2>Commande et réservation</h2>
      <p>
        Une commande boutique ou un abonnement est ferme après paiement. Un rendez-vous est enregistré dès la
        confirmation. Tu peux payer en ligne (Wave, Orange Money, Free Money via PayTech) ou au salon (espèces ou
        Mobile Money).
      </p>
      <h2>Exécution</h2>
      <p>
        Les prestations se tiennent au salon, ou à l&apos;adresse indiquée pour le domicile. Les produits boutique se
        retirent au salon. Voir la <Link href="/envois">politique d&apos;envois</Link>.
      </p>
      <h2>Droit de rétractation / retours</h2>
      <p>
        Les règles de déplacement, d&apos;annulation, de retour produit et de remboursement sont détaillées dans{" "}
        <Link href="/retours">Retours & remboursements</Link>.
      </p>
      <h2>Responsabilité</h2>
      <p>
        MAC NATION réalise les prestations avec le soin d&apos;un salon professionnel. Les photos du site sont indicatives.
        Un allergie ou une contre-indication doit être signalée avant la prestation.
      </p>
      <h2>Droit applicable</h2>
      <p>Les présentes CGV sont régies par le droit sénégalais. En cas de litige, une solution amiable est recherchée au salon avant toute action.</p>
    </LegalArticle>
  );
}
