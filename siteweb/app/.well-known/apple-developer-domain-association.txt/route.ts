import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Fichier que Apple demande pour vérifier le domaine Sign in with Apple. */
export function GET() {
  const body = (
    process.env.APPLE_DOMAIN_ASSOCIATION ||
    process.env.NEXT_PUBLIC_APPLE_DOMAIN_ASSOCIATION ||
    ""
  ).trim();
  if (!body) {
    return new NextResponse("Apple domain association not configured.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
