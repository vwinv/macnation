import Link from "next/link";

export default function PaiementAnnulePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-12 text-center">
      <div className="w-full max-w-md rounded-2xl bg-gray-950 p-8 stroke-gradient [--stroke-opacity:0.2]">
        <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
        <h1 className="font-bebas mt-3 text-5xl text-black">Paiement annulé</h1>
        <p className="mt-3 text-sm text-gray-400">Rien n’a été débité. Tu peux réessayer ou payer au salon en espèces, Wave ou Orange Money.</p>
        <Link href="/rendez-vous" className="btn-gold mt-8 inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-medium">
          Retour
        </Link>
      </div>
    </main>
  );
}
