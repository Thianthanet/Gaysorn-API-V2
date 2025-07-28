/*
  Warnings:

  - You are about to drop the column `unitNum` on the `Units` table. All the data in the column will be lost.
  - Added the required column `unitName` to the `Units` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Units" DROP COLUMN "unitNum",
ADD COLUMN     "unitName" VARCHAR(50) NOT NULL;
