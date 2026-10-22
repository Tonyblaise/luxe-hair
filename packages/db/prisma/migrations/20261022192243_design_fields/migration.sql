-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('percent', 'flat');

-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('retail', 'backbar');

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_client_id_fkey";

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "receipt_path" TEXT;

-- AlterTable
ALTER TABLE "inventory_products" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "price" INTEGER,
ADD COLUMN     "type" "InventoryType" NOT NULL DEFAULT 'retail';

-- AlterTable
ALTER TABLE "sales" ALTER COLUMN "client_id" DROP NOT NULL;

-- AlterTable: rename keeps existing commission values (all were percentages)
ALTER TABLE "services" RENAME COLUMN "commission_pct" TO "commission";
ALTER TABLE "services" ADD COLUMN     "commission_type" "CommissionType" NOT NULL DEFAULT 'percent';

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
