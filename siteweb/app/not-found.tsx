import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="title1 text-7xl">404</h1>
      <p className="mt-4 text-sm text-gray-400">Cette page n&apos;existe pas.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-lg bg-gray-400/15 px-8 text-sm text-black transition-all hover:bg-gray-200/80 hover:text-gray-950"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
