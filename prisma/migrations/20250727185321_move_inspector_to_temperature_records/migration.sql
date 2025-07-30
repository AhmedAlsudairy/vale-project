/*
  Warnings:

  - You are about to drop the column `inspector` on the `lrs_thermography_sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "lrs_temperature_records" ADD COLUMN     "inspector" TEXT;

-- AlterTable
ALTER TABLE "lrs_thermography_sessions" DROP COLUMN "inspector";
