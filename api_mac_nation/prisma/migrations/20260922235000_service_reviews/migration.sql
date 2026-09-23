CREATE TABLE "ServiceRating" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "ServiceRating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceReview" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,

    CONSTRAINT "ServiceReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceRating_serviceId_clientId_key" ON "ServiceRating"("serviceId", "clientId");

CREATE INDEX "ServiceRating_serviceId_createdAt_idx" ON "ServiceRating"("serviceId", "createdAt");

CREATE INDEX "ServiceReview_serviceId_createdAt_idx" ON "ServiceReview"("serviceId", "createdAt");

ALTER TABLE "ServiceRating" ADD CONSTRAINT "ServiceRating_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceRating" ADD CONSTRAINT "ServiceRating_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
