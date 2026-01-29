-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "licensePlate" TEXT,
ADD COLUMN     "stvzoApproved" BOOLEAN NOT NULL DEFAULT false;
