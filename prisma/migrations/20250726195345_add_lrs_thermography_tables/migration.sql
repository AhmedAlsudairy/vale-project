-- CreateTable
CREATE TABLE "lrs_thermography_sessions" (
    "id" SERIAL NOT NULL,
    "tag_number" TEXT NOT NULL,
    "equipment_name" TEXT NOT NULL,
    "equipment_type" TEXT NOT NULL,
    "inspector" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preview_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lrs_thermography_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lrs_temperature_records" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "point" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lrs_temperature_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lrs_temperature_records" ADD CONSTRAINT "lrs_temperature_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "lrs_thermography_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
