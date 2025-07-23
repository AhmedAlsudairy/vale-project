import { neon } from "@neondatabase/serverless"
import { prisma } from "./prisma"

export const sql = neon(process.env.DATABASE_URL)
export { prisma }

export interface CarbonBrushRecord {
  id: number
  tagNo: string
  equipmentName: string
  brushType: string
  inspectionDate: Date
  workOrderNo: string | null
  doneBy: string | null
  measurements: {
    [key: string]: number
  }
  slipRingThickness: number
  slipRingIr: number
  remarks: string | null
  createdAt: Date
  updatedAt: Date
  equipment?: {
    equipmentName: string
  } | null
}

export interface WindingResistanceRecord {
  id: number
  motorNo: string
  windingResistance: {
    ry: number
    yb: number
    rb: number
  }
  irValues: {
    ug_1min: number
    ug_10min: number
    vg_1min: number
    vg_10min: number
    wg_1min: number
    wg_10min: number
  }
  polarizationIndex: number | null
  darValues: {
    ug: number
    vg: number
    wg: number
  } | null
  inspectionDate: Date
  doneBy: string | null
  remarks: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Equipment {
  id: number
  tagNo: string
  equipmentName: string
  equipmentType: string
  location: string | null
  installationDate: Date | null
  createdAt: Date
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}
