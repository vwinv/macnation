export const POINT_FCFA = 1000;
export const REDEEM_POINTS = 10;
export const REDEEM_FCFA = 1000;

export function pointsForAmount(amount: number) {
  if (amount <= 0) return 0;
  return Math.floor(amount / POINT_FCFA);
}

export function planPerks(planId: string) {
  if (planId === "essentiel") return { visits: 2, boutiquePercent: 10, name: "Essentiel" };
  if (planId === "nation") return { visits: 4, boutiquePercent: 20, name: "Nation" };
  return { visits: 4, boutiquePercent: 15, name: "Signature" };
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
