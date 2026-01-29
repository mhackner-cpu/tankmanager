/*
  Warnings:

  - You are about to drop the column `category` on the `Machine` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Machine` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Machine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Machine` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CategoryFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOL', 'SELECT');

-- CreateEnum
CREATE TYPE "IntervalType" AS ENUM ('HOURS', 'KM', 'DAYS');

-- CreateEnum
CREATE TYPE "FileModule" AS ENUM ('MACHINE', 'MAINTENANCE', 'UVV');

-- DropIndex
DROP INDEX "Machine_name_idx";

-- AlterTable
ALTER TABLE "Machine" DROP COLUMN "category",
DROP COLUMN "name",
ADD COLUMN     "buildYear" INTEGER,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "counterCurrent" DECIMAL(12,2),
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "modelType" TEXT,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "primaryFuelType" "FuelType";

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryField" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CategoryFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "optionsJson" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineFieldValue" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "module" "FileModule" NOT NULL DEFAULT 'MACHINE',
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "storageKey" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePlan" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intervalType" "IntervalType" NOT NULL,
    "intervalValue" INTEGER NOT NULL,
    "preAlertValue" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_name_key" ON "Owner"("name");

-- CreateIndex
CREATE INDEX "Category_ownerId_idx" ON "Category"("ownerId");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_ownerId_name_key" ON "Category"("ownerId", "name");

-- CreateIndex
CREATE INDEX "CategoryField_categoryId_sortOrder_idx" ON "CategoryField"("categoryId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryField_categoryId_key_key" ON "CategoryField"("categoryId", "key");

-- CreateIndex
CREATE INDEX "MachineFieldValue_machineId_idx" ON "MachineFieldValue"("machineId");

-- CreateIndex
CREATE INDEX "MachineFieldValue_fieldId_idx" ON "MachineFieldValue"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "MachineFieldValue_machineId_fieldId_key" ON "MachineFieldValue"("machineId", "fieldId");

-- CreateIndex
CREATE INDEX "File_machineId_module_idx" ON "File"("machineId", "module");

-- CreateIndex
CREATE INDEX "MaintenancePlan_machineId_idx" ON "MaintenancePlan"("machineId");

-- CreateIndex
CREATE INDEX "Machine_ownerId_idx" ON "Machine"("ownerId");

-- CreateIndex
CREATE INDEX "Machine_categoryId_idx" ON "Machine"("categoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryField" ADD CONSTRAINT "CategoryField_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineFieldValue" ADD CONSTRAINT "MachineFieldValue_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineFieldValue" ADD CONSTRAINT "MachineFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CategoryField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
