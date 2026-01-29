-- Add engine detail fields to categories
ALTER TABLE "Category"
  ADD COLUMN "fuelType" "FuelType",
  ADD COLUMN "adBlueRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "counterType" "CounterType" NOT NULL DEFAULT 'NONE';
