-- CreateEnum
CREATE TYPE "PendingPaymentStatus" AS ENUM ('pending', 'paid', 'expired');

-- CreateTable
CREATE TABLE "PendingPayment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "paytechRef" TEXT NOT NULL,
    "paytechToken" TEXT,
    "paytechUrl" TEXT,
    "invoiceId" TEXT,
    "status" "PendingPaymentStatus" NOT NULL DEFAULT 'pending',
    "phone" TEXT NOT NULL,

    CONSTRAINT "PendingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingPayment_paytechRef_key" ON "PendingPayment"("paytechRef");

-- CreateIndex
CREATE INDEX "PendingPayment_paytechToken_idx" ON "PendingPayment"("paytechToken");

-- CreateIndex
CREATE INDEX "PendingPayment_status_expiresAt_idx" ON "PendingPayment"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "PendingPayment_phone_idx" ON "PendingPayment"("phone");
