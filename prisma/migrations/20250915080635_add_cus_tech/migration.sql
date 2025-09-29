-- AlterTable
ALTER TABLE "public"."ContractorNote" ADD COLUMN     "customer" BOOLEAN DEFAULT false,
ADD COLUMN     "number" VARCHAR(255),
ADD COLUMN     "technician" BOOLEAN DEFAULT false;
