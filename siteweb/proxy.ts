import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CLIENT_COOKIE = "mn_client";
const ADMIN_COOKIE = "mn_admin";

const COMPTE_PUBLIC = new Set([
  "/compte/login",
  "/api/compte/login",
  "/api/compte/register",
  "/api/compte/session",
  "/api/compte/logout",
  "/api/compte/oauth",
  "/api/compte/oauth/config",
]);

function hasCookie(request: NextRequest, name: string) {
  return Boolean(request.cookies.get(name)?.value);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (hasCookie(request, ADMIN_COOKIE)) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (pathname.startsWith("/compte") || pathname.startsWith("/api/compte")) {
    const clientOk = hasCookie(request, CLIENT_COOKIE);
    if (COMPTE_PUBLIC.has(pathname)) {
      if (clientOk && pathname === "/compte/login") {
        return NextResponse.redirect(new URL("/compte", request.url));
      }
      return NextResponse.next();
    }
    if (clientOk) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/compte/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/compte", "/compte/:path*", "/api/compte/:path*"],
};
export const proxyConfig = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/compte", "/compte/:path*", "/api/compte/:path*"],
};
