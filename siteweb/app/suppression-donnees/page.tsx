import type { Metadata } from "next";
import Link from "next/link";
import LegalArticle from "@/components/LegalArticle";

export const metadata: Metadata = { title: "Suppression des données" };

export default async function SuppressionDonneesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp.code;
  const code = Array.isArray(raw) ? raw[0] || "" : raw || "";

  return (
    <LegalArticle
      title="Suppression des données"
      subtitle="Demande Facebook prise en compte."
    >
      <p>
        Si tu as demandé la suppression de tes données via Facebook, le compte MAC NATION
        lié à cet identifiant a été oublié (identifiants sociaux retirés, nom anonymisé).
      </p>
      {code ? (
        <p>
          Code de confirmation : <strong>{code}</strong>
        </p>
      ) : (
        <p>Aucun code n’était joint à cette page. Tu peux quand même nous écrire si besoin.</p>
      )}
      <p>
        Pour toute autre demande (accès, correction, suppression hors Facebook), passe par la{" "}
        <Link href="/contact">page Contact</Link> ou au salon Nord Foire.
      </p>
    </LegalArticle>
  );
}
