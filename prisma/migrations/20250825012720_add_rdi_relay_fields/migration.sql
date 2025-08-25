/*
  Warnings:

  - You are about to drop the column `primary_5kv_pi` on the `winding_resistance_records` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "winding_resistance_records" DROP COLUMN "primary_5kv_pi",
ADD COLUMN     "primary_pi" JSONB,
ADD COLUMN     "rdi_set1" JSONB,
ADD COLUMN     "rdi_set2" JSONB;
