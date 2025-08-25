/*
  Warnings:

  - You are about to drop the column `mcc_forced_cooling_fan_temp` on the `esp_transformer_records` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "esp_transformer_records" DROP COLUMN "mcc_forced_cooling_fan_temp";
