export const DOMICILE_FEE = 2000;

export type PaymentMethod =
  'especes' | 'wave' | 'orange' | 'free' | 'paydunya' | 'autre';

export type InvoiceLine = {
  name: string;
  qty: number;
  unitPrice: number;
};

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'especes', label: 'Espèces' },
  { id: 'wave', label: 'Wave' },
  { id: 'orange', label: 'Orange Money' },
  { id: 'free', label: 'Free Money' },
  { id: 'paydunya', label: 'PayDunya' },
  { id: 'autre', label: 'Autre' },
];

export const EXPENSE_CATEGORIES = [
  { id: 'loyer', label: 'Loyer' },
  { id: 'produits', label: 'Produits' },
  { id: 'salaires', label: 'Salaires' },
  { id: 'transport', label: 'Transport' },
  { id: 'divers', label: 'Divers' },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['id'];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === 'string' &&
    PAYMENT_METHODS.some((item) => item.id === value)
  );
}

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return (
    typeof value === 'string' &&
    EXPENSE_CATEGORIES.some((item) => item.id === value)
  );
}

export function todayIso() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function asInvoiceLines(raw: unknown): InvoiceLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const item = (row || {}) as {
        name?: unknown;
        qty?: unknown;
        unitPrice?: unknown;
      };
      return {
        name: typeof item.name === 'string' ? item.name.trim() : '',
        qty: Number(item.qty) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      };
    })
    .filter((line) => line.name && line.qty > 0);
}

const METHOD_ALIASES: Record<string, PaymentMethod> = {
  especes: 'especes',
  salon: 'especes',
  cash: 'especes',
  wave: 'wave',
  orange: 'orange',
  orangemoney: 'orange',
  'orange-money': 'orange',
  free: 'free',
  freemoney: 'free',
  'free-money': 'free',
  paydunya: 'paydunya',
  autre: 'autre',
};

export function parsePaymentMethod(value?: string): PaymentMethod {
  const key = (value || 'wave').trim().toLowerCase().replace(/\s+/g, '');
  return METHOD_ALIASES[key] || 'wave';
}

export function isHomeVisitService(serviceId: string) {
  return serviceId === 'domicile';
}

export function bookingAmount(
  unitPrice: number,
  place: 'salon' | 'domicile',
  serviceId: string,
) {
  const base = Math.max(0, Math.round(unitPrice || 0));
  if (place === 'domicile' && !isHomeVisitService(serviceId)) {
    return base + DOMICILE_FEE;
  }
  return base;
}

export function bookingLines(
  serviceName: string,
  unitPrice: number,
  place: 'salon' | 'domicile',
  serviceId: string,
): InvoiceLine[] {
  const lines: InvoiceLine[] = [
    { name: serviceName, qty: 1, unitPrice: Math.max(0, Math.round(unitPrice || 0)) },
  ];
  if (place === 'domicile' && !isHomeVisitService(serviceId)) {
    lines.push({
      name: 'Déplacement domicile',
      qty: 1,
      unitPrice: DOMICILE_FEE,
    });
  }
  return lines;
}

export function invoiceTotal(items: InvoiceLine[]) {
  return items.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
}

export function formatFcfa(n: number) {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))} F`;
}
