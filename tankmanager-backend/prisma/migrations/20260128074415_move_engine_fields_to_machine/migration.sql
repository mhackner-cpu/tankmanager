/*
  Warnings:

  - You are about to drop the column `adBlueRequired` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `counterType` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `fuelType` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `hasEngine` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "adBlueRequired",
DROP COLUMN "counterType",
DROP COLUMN "fuelType",
DROP COLUMN "hasEngine";

-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "adBlueRequired" BOOLEAN NOT NULL DEFAULT false;
