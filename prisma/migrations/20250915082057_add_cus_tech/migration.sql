-- AlterTable
ALTER TABLE "public"."RepairChoice" ADD COLUMN     "customer" BOOLEAN DEFAULT false,
ADD COLUMN     "technician" BOOLEAN DEFAULT false;
