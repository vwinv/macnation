import type { Metadata } from "next";
import Link from "next/link";
import LegalArticle from "@/components/LegalArticle";

export const metadata: Metadata = { title: "Retours & remboursements" };

export default function RetoursPage() {
  return (
    <LegalArticle title="Retours & remboursements" subtitle="Boutique, abonnements, rendez-vous et paiements Mobile Money.">
      <h2>Boutique</h2>
      <p>
        Les produits se retirent au salon Nord Foire. Un retour est possible sous 7 jours si l&apos;article est non ouvert,
        non utilisé, dans son emballage d&apos;origine. Présente la preuve de paiement. Les produits d&apos;hygiène ouverts ne
        sont ni repris ni échangés.
      </p>
      <h2>Rendez-vous</h2>
      <p>
        Un RDV payé en ligne peut être déplacé si tu préviens au moins 4 heures avant. En cas d&apos;absence sans prévenir,
        la séance n&apos;est pas remboursée. Si le salon annule, tu es remboursé ou reprogrammé, au choix.
      </p>
      <h2>Abonnements</h2>
      <p>
        Un abonnement commence à la date d&apos;achat. Les visites non utilisées ne se reportent pas au mois suivant, sauf
        accord de l&apos;équipe. Pas de remboursement d&apos;un abonnement déjà commencé, sauf fermeture du salon.
      </p>
      <h2>Paiements</h2>
      <p>
        Wave, Orange Money et Free Money sont encaissés via PayTech. Un remboursement validé est renvoyé sur le même
        moyen de paiement, sous 7 à 14 jours ouvrés, selon l&apos;opérateur. Pour une réclamation :{" "}
        <Link href="/contact">Contact</Link> ou au salon, avec le numéro de facture.
      </p>
    </LegalArticle>
  );
}
