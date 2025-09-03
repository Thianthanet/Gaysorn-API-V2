-- AlterTable
ALTER TABLE "public"."ContractorNote" ADD COLUMN     "fakeDelete" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "public"."RepairChoice" ADD COLUMN     "fakeDelete" BOOLEAN DEFAULT false;
