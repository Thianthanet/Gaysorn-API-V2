-- DropForeignKey
ALTER TABLE "TechBuild" DROP CONSTRAINT "TechBuild_techId_fkey";

-- AlterTable
ALTER TABLE "TechBuild" ALTER COLUMN "techId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Units" ALTER COLUMN "unitName" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TechBuild" ADD CONSTRAINT "TechBuild_techId_fkey" FOREIGN KEY ("techId") REFERENCES "Technician"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
