CREATE TABLE "ProductRating" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "ProductRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductRating_productId_clientId_key" ON "ProductRating"("productId", "clientId");

CREATE INDEX "ProductRating_productId_createdAt_idx" ON "ProductRating"("productId", "createdAt");

ALTER TABLE "ProductRating" ADD CONSTRAINT "ProductRating_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductRating" ADD CONSTRAINT "ProductRating_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ProductRating" ("id", "createdAt", "productId", "clientId", "rating")
SELECT "id", "createdAt", "productId", "clientId", "rating"
FROM "ProductReview"
WHERE "rating" IS NOT NULL;

DROP INDEX "ProductReview_productId_clientId_key";

ALTER TABLE "ProductReview" DROP COLUMN "rating";

DELETE FROM "ProductReview" WHERE TRIM("comment") = '';
