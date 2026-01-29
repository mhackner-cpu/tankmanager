-- Update any ADBLUE values to NULL
UPDATE "Machine" SET "primaryFuelType" = NULL WHERE "primaryFuelType" = 'ADBLUE';
UPDATE "FuelEntry" SET "fuelType" = 'DIESEL' WHERE "fuelType" = 'ADBLUE';

-- Remove ADBLUE from enum
ALTER TYPE "FuelType" RENAME TO "FuelType_old";
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'GASOLINE', 'ELECTRIC');
ALTER TABLE "Machine" ALTER COLUMN "primaryFuelType" TYPE "FuelType" USING "primaryFuelType"::text::"FuelType";
ALTER TABLE "FuelEntry" ALTER COLUMN "fuelType" TYPE "FuelType" USING "fuelType"::text::"FuelType";
DROP TYPE "FuelType_old";