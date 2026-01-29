-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "inventoryMiddleHint" TEXT,
ADD COLUMN     "inventoryPrefix" TEXT;

-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "inventoryMiddle" TEXT;
