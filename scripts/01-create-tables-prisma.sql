-- Create equipment_master table
CREATE TABLE IF NOT EXISTS "equipment_master" (
  "id" SERIAL PRIMARY KEY,
  "tag_no" VARCHAR(50) UNIQUE NOT NULL,
  "equipment_name" VARCHAR(100) NOT NULL,
  "equipment_type" VARCHAR(50) NOT NULL,
  "location" VARCHAR(100),
  "installation_date" DATE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create carbon_brush_records table
CREATE TABLE IF NOT EXISTS "carbon_brush_records" (
  "id" SERIAL PRIMARY KEY,
  "tag_no" VARCHAR(50) NOT NULL,
  "equipment_name" VARCHAR(100) NOT NULL,
  "brush_type" VARCHAR(20) DEFAULT 'C80X',
  "inspection_date" DATE NOT NULL,
  "work_order_no" VARCHAR(50),
  "done_by" VARCHAR(100),
  "measurements" JSONB NOT NULL,
  "slip_ring_thickness" DECIMAL(5,2) NOT NULL,
  "slip_ring_ir" DECIMAL(10,2) NOT NULL,
  "remarks" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create winding_resistance_records table
CREATE TABLE IF NOT EXISTS "winding_resistance_records" (
  "id" SERIAL PRIMARY KEY,
  "motor_no" VARCHAR(50) NOT NULL,
  "winding_resistance" JSONB NOT NULL,
  "ir_values" JSONB NOT NULL,
  "polarization_index" DECIMAL(5,2),
  "dar_values" JSONB,
  "inspection_date" DATE NOT NULL,
  "done_by" VARCHAR(100),
  "remarks" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Insert sample equipment data
INSERT INTO "equipment_master" ("tag_no", "equipment_name", "equipment_type", "location") VALUES
('BO.3161.04.M1', 'Induration Fan Motor', 'Motor', 'Induration Area'),
('BO.3161.05.M1', 'Cooling Fan Motor', 'Motor', 'Cooling Area'),
('BO.3161.06.M1', 'Exhaust Fan Motor', 'Motor', 'Exhaust Area')
ON CONFLICT ("tag_no") DO NOTHING;

-- Add foreign key constraints
ALTER TABLE "carbon_brush_records" 
ADD CONSTRAINT "fk_carbon_brush_equipment" 
FOREIGN KEY ("tag_no") REFERENCES "equipment_master"("tag_no") ON DELETE CASCADE;

ALTER TABLE "winding_resistance_records" 
ADD CONSTRAINT "fk_winding_resistance_equipment" 
FOREIGN KEY ("motor_no") REFERENCES "equipment_master"("tag_no") ON DELETE CASCADE;
