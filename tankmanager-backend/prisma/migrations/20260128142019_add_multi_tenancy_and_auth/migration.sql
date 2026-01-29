/*
  Warnings:

  - A unique constraint covering the columns `[companyId,name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,inventoryNo]` on the table `Machine` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,name]` on the table `Owner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `Machine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Owner` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DRIVER', 'MECHANIC', 'MANAGEMENT', 'VIEWER');

-- DropIndex
DROP INDEX "Category_name_key";

-- DropIndex
DROP INDEX "Machine_inventoryNo_key";

-- DropIndex
DROP INDEX "Owner_name_key";

-- CreateTable (Company zuerst erstellen)
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "licenseExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- Insert default company for existing data
INSERT INTO "Company" ("id", "name", "domain", "email", "active", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'Moosmühle GmbH', 'moosmuehle.com', 'info@moosmuehle.com', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: Add companyId columns with the default company ID
ALTER TABLE "Category" ADD COLUMN "companyId" TEXT;

ALTER TABLE "Owner" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE "Owner" ALTER COLUMN "companyId" DROP DEFAULT;

ALTER TABLE "Machine" ADD COLUMN "companyId" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE "Machine" ALTER COLUMN "companyId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_active_idx" ON "Company"("active");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_userId_idx" ON "UserRoleAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleAssignment_userId_role_key" ON "UserRoleAssignment"("userId", "role");

-- CreateIndex
CREATE INDEX "Category_companyId_idx" ON "Category"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_companyId_name_key" ON "Category"("companyId", "name");

-- CreateIndex
CREATE INDEX "Machine_companyId_idx" ON "Machine"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_companyId_inventoryNo_key" ON "Machine"("companyId", "inventoryNo");

-- CreateIndex
CREATE INDEX "Owner_companyId_idx" ON "Owner"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_companyId_name_key" ON "Owner"("companyId", "name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (Category nullable - kein NOT NULL constraint)
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
