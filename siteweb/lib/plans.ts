export type PublicPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  featured: boolean;
  perks: string[];
  visits: number;
  boutiquePercent: number;
};

function apiOrigin() {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
}

export async function fetchPublicPlans(): Promise<PublicPlan[]> {
  const res = await fetch(`${apiOrigin()}/api/catalog/plans`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as PublicPlan[] | { plans?: PublicPlan[] };
  return Array.isArray(json) ? json : json.plans || [];
}

export async function fetchPublicPlan(id: string) {
  const res = await fetch(`${apiOrigin()}/api/catalog/plans/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as PublicPlan;
}
