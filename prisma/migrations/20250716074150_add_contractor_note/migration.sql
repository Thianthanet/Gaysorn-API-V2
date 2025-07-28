-- AlterTable
ALTER TABLE "Repair" ADD COLUMN     "contractorNote" VARCHAR(255);

-- CreateTable
CREATE TABLE "ContractorNote" (
    "id" SERIAL NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorNote_pkey" PRIMARY KEY ("id")
);
