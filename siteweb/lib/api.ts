import { cookies } from "next/headers";
import type { Booking, Invoice } from "@/lib/salon-types";

export function apiOrigin() {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(
    /\/$/,
    "",
  );
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const cookie = (await cookies()).toString();
  const url = `${apiOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  if (cookie && !headers.has("cookie")) headers.set("cookie", cookie);
  return fetch(url, { ...init, headers, cache: "no-store" });
}

export type CatalogService = {
  id: string;
  name: string;
  duration: string;
  description: string;
  category: string;
  image: string;
  price: number | null;
  priceLabel: string | null;
};

export async function getCatalogServices(): Promise<CatalogService[]> {
  const res = await apiFetch("/api/catalog/services");
  if (!res.ok) return [];
  const json = (await res.json().catch(() => null)) as unknown;
  return Array.isArray(json) ? json : [];
}

export async function getCatalogService(id: string): Promise<CatalogService | null> {
  const res = await apiFetch(`/api/catalog/services/${id}`);
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as (CatalogService & { id?: string; name?: string }) | null;
  if (!json?.id || !json.name) return null;
  return json;
}

export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  images?: string[];
  price: number;
};

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const res = await apiFetch("/api/catalog/products");
  if (!res.ok) return [];
  const json = (await res.json().catch(() => null)) as unknown;
  return Array.isArray(json) ? json : [];
}

export async function getCatalogProduct(id: string): Promise<CatalogProduct | null> {
  const res = await apiFetch(`/api/catalog/products/${id}`);
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as (CatalogProduct & { id?: string; name?: string }) | null;
  if (!json?.id || !json.name) return null;
  const images = Array.isArray(json.images) && json.images.length
    ? json.images.filter(Boolean).slice(0, 4)
    : json.image
      ? [json.image]
      : [];
  return { ...json, image: images[0] || json.image, images };
}

export type CatalogFeedback = {
  reviews: { id: string; createdAt: string; rating: number | null; comment: string; name: string }[];
  average: number;
  count: number;
  myRating: number | null;
};

async function getCatalogFeedback(path: string): Promise<CatalogFeedback> {
  const empty = { reviews: [], average: 0, count: 0, myRating: null };
  const res = await apiFetch(path);
  if (!res.ok) return empty;
  const json = (await res.json().catch(() => null)) as {
    reviews?: CatalogFeedback["reviews"];
    average?: number;
    count?: number;
    myRating?: number | null;
  } | null;
  if (!json || !Array.isArray(json.reviews)) return empty;
  return {
    reviews: json.reviews,
    average: Number(json.average) || 0,
    count: Number(json.count) || json.reviews.length,
    myRating: typeof json.myRating === "number" ? json.myRating : null,
  };
}

export function getCatalogProductReviews(id: string) {
  return getCatalogFeedback(`/api/catalog/products/${id}/reviews`);
}

export function getCatalogServiceReviews(id: string) {
  return getCatalogFeedback(`/api/catalog/services/${id}/reviews`);
}

export async function getPublicInvoice(id: string): Promise<Invoice | null> {
  const res = await apiFetch(`/api/invoices/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as Invoice;
}

export async function getAdminInvoice(id: string): Promise<{
  invoice: Invoice;
  booking: Booking | null;
} | "unauthorized" | null> {
  const res = await apiFetch(`/api/admin/invoices/${id}`);
  if (res.status === 401) return "unauthorized";
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as { invoice: Invoice; booking: Booking | null };
}

export async function settlePaytech(invoiceId: string) {
  const query = new URLSearchParams({ invoice: invoiceId });
  await apiFetch(`/api/paytech/status?${query.toString()}`);
}

export type PaytechStatus = {
  paid: boolean;
  invoiceId?: string;
  kind?: string;
  booking?: { dateLabel: string; time: string; serviceName: string; place: string };
};

export async function settlePaytechPending(pendingId: string): Promise<PaytechStatus> {
  const query = new URLSearchParams({ pending: pendingId });
  const res = await apiFetch(`/api/paytech/status?${query.toString()}`);
  if (!res.ok) return { paid: false };
  const json = (await res.json().catch(() => null)) as PaytechStatus | null;
  return {
    paid: json?.paid === true,
    invoiceId: json?.invoiceId,
    kind: json?.kind,
    booking: json?.booking,
  };
}
