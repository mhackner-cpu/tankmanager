/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_ownerId_fkey";

-- DropIndex
DROP INDEX "Category_ownerId_idx";

-- DropIndex
DROP INDEX "Category_ownerId_name_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "ownerId";

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
