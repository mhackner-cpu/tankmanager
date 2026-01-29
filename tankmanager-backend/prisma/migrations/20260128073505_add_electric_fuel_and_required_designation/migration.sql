/*
  Warnings:

  - Made the column `designation` on table `Machine` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "FuelType" ADD VALUE 'ELECTRIC';

-- AlterTable
ALTER TABLE "Machine" ALTER COLUMN "designation" SET NOT NULL;
