-- CreateTable
CREATE TABLE "equipment_master" (
    "id" SERIAL NOT NULL,
    "tag_no" TEXT NOT NULL,
    "equipment_name" TEXT NOT NULL,
    "equipment_type" TEXT NOT NULL,
    "location" TEXT,
    "installation_date" TIMESTAMP(3),
    "qr_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carbon_brush_records" (
    "id" SERIAL NOT NULL,
    "tag_no" TEXT NOT NULL,
    "equipment_name" TEXT NOT NULL,
    "brush_type" TEXT NOT NULL DEFAULT 'C80X',
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "work_order_no" TEXT,
    "done_by" TEXT,
    "measurements" JSONB NOT NULL,
    "slip_ring_thickness" DOUBLE PRECISION NOT NULL,
    "slip_ring_ir" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carbon_brush_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "winding_resistance_records" (
    "id" SERIAL NOT NULL,
    "motor_no" TEXT NOT NULL,
    "winding_resistance" JSONB NOT NULL,
    "ir_values" JSONB NOT NULL,
    "polarization_index" DOUBLE PRECISION,
    "dar_values" JSONB,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "done_by" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "winding_resistance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thermography_records" (
    "id" SERIAL NOT NULL,
    "transformer_no" TEXT NOT NULL,
    "equipment_type" TEXT NOT NULL DEFAULT 'ESP',
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "done_by" TEXT,
    "measurements" JSONB NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thermography_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_master_tag_no_key" ON "equipment_master"("tag_no");

-- AddForeignKey
ALTER TABLE "carbon_brush_records" ADD CONSTRAINT "carbon_brush_records_tag_no_fkey" FOREIGN KEY ("tag_no") REFERENCES "equipment_master"("tag_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winding_resistance_records" ADD CONSTRAINT "winding_resistance_records_motor_no_fkey" FOREIGN KEY ("motor_no") REFERENCES "equipment_master"("tag_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thermography_records" ADD CONSTRAINT "thermography_records_transformer_no_fkey" FOREIGN KEY ("transformer_no") REFERENCES "equipment_master"("tag_no") ON DELETE RESTRICT ON UPDATE CASCADE;
