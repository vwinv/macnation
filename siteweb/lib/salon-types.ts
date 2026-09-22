import type { InvoiceLine, PaymentMethod, ExpenseCategory } from "./money";

export type BookingStatus = "nouveau" | "confirme" | "termine" | "annule";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded";
export type InvoiceStatus = "brouillon" | "envoyee" | "payee" | "annulee";
export type InvoiceKind = "rdv" | "boutique" | "abonnement" | "caisse";
export type MembershipStatus = "actif" | "expire" | "annule";
export type ApplicationStatus = "nouvelle" | "vue" | "retenue" | "refusee";
export type OauthProvider = "google" | "apple" | "facebook";

export type Booking = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  serviceId: string;
  serviceName: string;
  dateIso: string;
  dateLabel: string;
  time: string;
  durationMin?: number;
  place: "salon" | "domicile";
  address: string;
  status: BookingStatus;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  invoiceId?: string;
  clientId?: string;
  quoted?: boolean;
};

export type Invoice = {
  id: string;
  number: string;
  createdAt: string;
  paidAt?: string;
  bookingId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  items: InvoiceLine[];
  amount: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  paydunyaToken?: string;
  paydunyaUrl?: string;
  note?: string;
  kind?: InvoiceKind;
  clientId?: string;
  planId?: string;
};

export type Payment = {
  id: string;
  createdAt: string;
  invoiceId?: string;
  bookingId?: string;
  amount: number;
  method: PaymentMethod;
  status: "pending" | "completed" | "failed";
  note?: string;
  paydunyaToken?: string;
};

export type Expense = {
  id: string;
  createdAt: string;
  dateIso: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
};

export type Application = {
  id: string;
  createdAt: string;
  jobId: string;
  jobTitle: string;
  name: string;
  phone: string;
  email: string;
  letter: string;
  cvName: string;
  cvPath: string;
  letterName?: string;
  letterPath?: string;
  status: ApplicationStatus;
};

export type PublicClient = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  creditFcfa: number;
  providers: OauthProvider[];
  hasPassword?: boolean;
};

export type LoyaltyEvent = {
  id: string;
  createdAt: string;
  clientId: string;
  kind: "earn" | "redeem" | "adjust";
  points: number;
  creditFcfa: number;
  label: string;
  invoiceId?: string;
};

export type Membership = {
  id: string;
  createdAt: string;
  clientId: string;
  planId: string;
  planName: string;
  startedAt: string;
  expiresAt: string;
  visitsTotal: number;
  visitsUsed: number;
  boutiquePercent: number;
  status: MembershipStatus;
  invoiceId?: string;
};
