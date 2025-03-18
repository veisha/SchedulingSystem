/*
  Warnings:

  - You are about to drop the column `schedules` on the `SharedSchedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SharedSchedule" DROP COLUMN "schedules",
ADD COLUMN     "scheduleIds" TEXT[];
