/*
  Warnings:

  - You are about to drop the column `measurements` on the `thermography_records` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[esp_filter_id,step_number,transformer_no]` on the table `thermography_records` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `esp_filter_id` to the `thermography_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `step_name` to the `thermography_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `step_number` to the `thermography_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "thermography_records" DROP COLUMN "measurements",
ADD COLUMN     "esp_filter_id" TEXT NOT NULL,
ADD COLUMN     "kv_ma" TEXT,
ADD COLUMN     "mcc_forced_cooling_fan_temp" TEXT,
ADD COLUMN     "mccb_body_temp" DOUBLE PRECISION,
ADD COLUMN     "mccb_c_og1" DOUBLE PRECISION,
ADD COLUMN     "mccb_c_og2" DOUBLE PRECISION,
ADD COLUMN     "mccb_ic_b_phase" DOUBLE PRECISION,
ADD COLUMN     "mccb_ic_r_phase" DOUBLE PRECISION,
ADD COLUMN     "panel_exhaust_fan" TEXT,
ADD COLUMN     "rdi68" DOUBLE PRECISION,
ADD COLUMN     "rdi69" DOUBLE PRECISION,
ADD COLUMN     "rdi70" DOUBLE PRECISION,
ADD COLUMN     "scr_cooling_fan" TEXT,
ADD COLUMN     "scr_cooling_fins_temp" DOUBLE PRECISION,
ADD COLUMN     "sp_min" TEXT,
ADD COLUMN     "step_name" TEXT NOT NULL,
ADD COLUMN     "step_number" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "esp_steps" (
    "id" SERIAL NOT NULL,
    "esp_filter_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "step_description" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esp_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "esp_steps_esp_filter_id_step_number_key" ON "esp_steps"("esp_filter_id", "step_number");

-- CreateIndex
CREATE UNIQUE INDEX "thermography_records_esp_filter_id_step_number_transformer__key" ON "thermography_records"("esp_filter_id", "step_number", "transformer_no");
