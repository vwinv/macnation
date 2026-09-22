-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('loyer', 'produits', 'salaires', 'transport', 'divers');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('nouvelle', 'vue', 'retenue', 'refusee');

-- CreateEnum
CREATE TYPE "PaymentRecordStatus" AS ENUM ('pending', 'completed', 'failed');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "appleId" TEXT,
ADD COLUMN     "facebookId" TEXT,
ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "pinHash" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "paydunyaToken" TEXT,
ADD COLUMN     "paydunyaUrl" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT,
    "bookingId" TEXT,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'completed',
    "note" TEXT,
    "paydunyaToken" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateIso" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "letter" TEXT NOT NULL DEFAULT '',
    "cvName" TEXT NOT NULL,
    "cvPath" TEXT NOT NULL,
    "letterName" TEXT,
    "letterPath" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'nouvelle',

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
