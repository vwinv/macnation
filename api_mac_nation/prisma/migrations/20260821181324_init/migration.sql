-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('nouveau', 'confirme', 'termine', 'annule');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'pending', 'paid', 'refunded');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('brouillon', 'envoyee', 'payee', 'annulee');

-- CreateEnum
CREATE TYPE "InvoiceKind" AS ENUM ('rdv', 'boutique', 'abonnement', 'caisse');

-- CreateEnum
CREATE TYPE "Place" AS ENUM ('salon', 'domicile');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('especes', 'wave', 'orange', 'free', 'paydunya', 'autre');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('actif', 'expire', 'annule');

-- CreateEnum
CREATE TYPE "LoyaltyKind" AS ENUM ('earn', 'redeem', 'adjust');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "pinHash" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "creditFcfa" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "serviceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "dateIso" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "place" "Place" NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "status" "BookingStatus" NOT NULL DEFAULT 'nouveau',
    "amount" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "paymentMethod" "PaymentMethod",
    "clientId" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "bookingId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL DEFAULT '',
    "items" JSONB NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'envoyee',
    "paymentMethod" "PaymentMethod",
    "note" TEXT,
    "kind" "InvoiceKind" NOT NULL DEFAULT 'caisse',
    "clientId" TEXT,
    "planId" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceCounter" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "kind" "LoyaltyKind" NOT NULL,
    "points" INTEGER NOT NULL,
    "creditFcfa" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "invoiceId" TEXT,

    CONSTRAINT "LoyaltyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "visitsTotal" INTEGER NOT NULL,
    "visitsUsed" INTEGER NOT NULL DEFAULT 0,
    "boutiquePercent" INTEGER NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'actif',
    "invoiceId" TEXT,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");

-- CreateIndex
CREATE INDEX "Booking_dateIso_time_idx" ON "Booking"("dateIso", "time");

-- CreateIndex
CREATE INDEX "Booking_phone_idx" ON "Booking"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bookingId_key" ON "Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "LoyaltyEvent_clientId_idx" ON "LoyaltyEvent"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_invoiceId_key" ON "Membership"("invoiceId");

-- CreateIndex
CREATE INDEX "Membership_clientId_status_idx" ON "Membership"("clientId", "status");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyEvent" ADD CONSTRAINT "LoyaltyEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
