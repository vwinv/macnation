ALTER TABLE "Product" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Product" SET "images" = ARRAY["image"] WHERE "image" IS NOT NULL AND "image" <> '';
