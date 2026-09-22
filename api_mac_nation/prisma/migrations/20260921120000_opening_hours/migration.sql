-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "durationMin" INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE "OpeningHour" (
    "weekday" INTEGER NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT NOT NULL DEFAULT '10:00',
    "closeTime" TEXT NOT NULL DEFAULT '21:00',

    CONSTRAINT "OpeningHour_pkey" PRIMARY KEY ("weekday")
);

-- CreateTable
CREATE TABLE "ClosedDate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateIso" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ClosedDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClosedDate_dateIso_key" ON "ClosedDate"("dateIso");
