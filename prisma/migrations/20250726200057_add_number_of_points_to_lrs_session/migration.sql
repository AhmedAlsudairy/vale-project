/*
  Warnings:

  - Added the required column `number_of_points` to the `lrs_thermography_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "lrs_thermography_sessions" ADD COLUMN     "number_of_points" INTEGER NOT NULL;
