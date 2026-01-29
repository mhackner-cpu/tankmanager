-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOANED');

-- CreateEnum
CREATE TYPE "CounterType" AS ENUM ('HOURS', 'KM', 'NONE');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'GASOLINE', 'ADBLUE');

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "inventoryNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "counterType" "CounterType" NOT NULL,
    "counterStartValue" DECIMAL(12,2) NOT NULL,
    "status" "MachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelEntry" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "userName" TEXT NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "liters" DECIMAL(12,2) NOT NULL,
    "counterValue" DECIMAL(12,2),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Machine_inventoryNo_key" ON "Machine"("inventoryNo");

-- CreateIndex
CREATE INDEX "Machine_status_idx" ON "Machine"("status");

-- CreateIndex
CREATE INDEX "Machine_inventoryNo_idx" ON "Machine"("inventoryNo");

-- CreateIndex
CREATE INDEX "Machine_name_idx" ON "Machine"("name");

-- CreateIndex
CREATE INDEX "FuelEntry_machineId_dateTime_idx" ON "FuelEntry"("machineId", "dateTime");

-- CreateIndex
CREATE INDEX "FuelEntry_fuelType_idx" ON "FuelEntry"("fuelType");

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
