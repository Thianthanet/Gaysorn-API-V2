/*
  Warnings:

  - You are about to drop the column `description` on the `Repair` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Repair" DROP COLUMN "description",
ADD COLUMN     "detail" VARCHAR(500);
