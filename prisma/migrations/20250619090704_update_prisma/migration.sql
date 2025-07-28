/*
  Warnings:

  - You are about to drop the column `name` on the `Building` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Building" DROP COLUMN "name",
ADD COLUMN     "buildingName" VARCHAR(50);

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "name",
ADD COLUMN     "companyName" VARCHAR(50);
