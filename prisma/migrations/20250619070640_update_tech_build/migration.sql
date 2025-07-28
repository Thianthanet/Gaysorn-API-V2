-- DropForeignKey
ALTER TABLE "TechBuild" DROP CONSTRAINT "TechBuild_techId_fkey";

-- AlterTable
ALTER TABLE "TechBuild" ALTER COLUMN "techId" SET DATA TYPE VARCHAR(50);

-- AddForeignKey
ALTER TABLE "TechBuild" ADD CONSTRAINT "TechBuild_techId_fkey" FOREIGN KEY ("techId") REFERENCES "Technician"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
