/*
  Warnings:

  - You are about to drop the column `esp_filter_id` on the `thermography_records` table. All the data in the column will be lost.
  - You are about to drop the column `step_name` on the `thermography_records` table. All the data in the column will be lost.
  - You are about to drop the column `step_number` on the `thermography_records` table. All the data in the column will be lost.
  - You are about to drop the `esp_steps` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "thermography_records_esp_filter_id_step_number_transformer__key";

-- AlterTable
ALTER TABLE "thermography_records" DROP COLUMN "esp_filter_id",
DROP COLUMN "step_name",
DROP COLUMN "step_number";

-- DropTable
DROP TABLE "esp_steps";

-- CreateTable
CREATE TABLE "esp_thermography_sessions" (
    "id" SERIAL NOT NULL,
    "esp_code" TEXT NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "done_by" TEXT,
    "step" INTEGER NOT NULL DEFAULT 1,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esp_thermography_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esp_transformer_records" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "transformer_no" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "mccb_ic_r_phase" DOUBLE PRECISION,
    "mccb_ic_b_phase" DOUBLE PRECISION,
    "mccb_c_og1" DOUBLE PRECISION,
    "mccb_c_og2" DOUBLE PRECISION,
    "mccb_body_temp" DOUBLE PRECISION,
    "kv_ma" TEXT,
    "sp_min" TEXT,
    "scr_cooling_fins_temp" DOUBLE PRECISION,
    "scr_cooling_fan" TEXT,
    "panel_exhaust_fan" TEXT,
    "mcc_forced_cooling_fan_temp" TEXT,
    "rdi68" DOUBLE PRECISION,
    "rdi69" DOUBLE PRECISION,
    "rdi70" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esp_transformer_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "esp_transformer_records" ADD CONSTRAINT "esp_transformer_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "esp_thermography_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
