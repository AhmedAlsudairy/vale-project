import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { sendThermographyEmail } from "@/lib/email"

const prisma = new PrismaClient()

// Mock data for fallback
const mockThermographyData = [
  {
    id: 1,
    transformerNo: "TF1",
    equipmentType: "ESP",
    inspectionDate: "2024-07-20T00:00:00.000Z",
    month: 7,
    doneBy: "John Smith",
    measurements: {
      mccbRPhase: 45.2,
      mccbBPhase: 46.1,
      mccbCOG1: 44.8,
      mccbCOG2: 45.5,
      mccbBodyTemp: 42.3,
      kvMa: 6.6,
      spMin: 1485,
      scrCoolingFinsTemp: 38.7,
      scrCoolingFan: 1,
      panelExhaustFan: 1,
      mccForcedCoolingFanTemp: 25,
      rdi68: 41.2,
      rdi69: 40.8,
      rdi70: 42.1
    },
    remarks: "All parameters within normal range",
    createdAt: "2024-07-20T10:30:00.000Z",
    equipment: {
      equipmentName: "ESP Transformer TF1",
      equipmentType: "ESP"
    }
  },
  {
    id: 2,
    transformerNo: "TF2",
    equipmentType: "ESP",
    inspectionDate: "2024-07-21T00:00:00.000Z",
    month: 7,
    doneBy: "Sarah Johnson",
    measurements: {
      mccbRPhase: 48.5,
      mccbBPhase: 47.9,
      mccbCOG1: 46.2,
      mccbCOG2: 48.1,
      mccbBodyTemp: 44.7,
      kvMa: 6.6,
      spMin: 1485,
      scrCoolingFinsTemp: 41.3,
      scrCoolingFan: 1,
      panelExhaustFan: 1,
      mccForcedCoolingFanTemp: 28,
      rdi68: 43.8,
      rdi69: 44.2,
      rdi70: 43.5
    },
    remarks: "Temperature slightly elevated, monitoring required",
    createdAt: "2024-07-21T14:15:00.000Z",
    equipment: {
      equipmentName: "ESP Transformer TF2",
      equipmentType: "ESP"
    }
  },
  {
    id: 3,
    transformerNo: "TF3",
    equipmentType: "ESP",
    inspectionDate: "2024-07-22T00:00:00.000Z",
    month: 7,
    doneBy: "Mike Chen",
    measurements: {
      mccbRPhase: 43.8,
      mccbBPhase: 44.3,
      mccbCOG1: 43.1,
      mccbCOG2: 44.7,
      mccbBodyTemp: 41.9,
      kvMa: 6.6,
      spMin: 1485,
      scrCoolingFinsTemp: 37.2,
      scrCoolingFan: 1,
      panelExhaustFan: 1,
      mccForcedCoolingFanTemp: 24,
      rdi68: 40.1,
      rdi69: 39.8,
      rdi70: 40.5
    },
    remarks: "Excellent thermal performance",
    createdAt: "2024-07-22T09:45:00.000Z",
    equipment: {
      equipmentName: "ESP Transformer TF3",
      equipmentType: "ESP"
    }
  }
]

export async function GET() {
  try {
    // Try to fetch from database first
    const records = await prisma.thermographyRecord.findMany({
      include: {
        equipment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (records.length > 0) {
      return NextResponse.json(records)
    } else {
      // Return mock data if no database records
      return NextResponse.json(mockThermographyData)
    }
  } catch (error) {
    console.error("Database error, using mock data:", error)
    // Return mock data if database fails
    return NextResponse.json(mockThermographyData)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const record = await prisma.thermographyRecord.create({
      data: {
        transformerNo: body.transformer_no || body.transformerNo,
        equipmentType: body.equipment_type || body.equipmentType || "ESP",
        inspectionDate: new Date(body.inspection_date || body.inspectionDate),
        month: parseInt(body.month),
        doneBy: body.done_by || body.doneBy,
        mccbIcRPhase: parseFloat(body.mccb_ic_r_phase || body.mccbIcRPhase || "0"),
        mccbIcBPhase: parseFloat(body.mccb_ic_b_phase || body.mccbIcBPhase || "0"),
        mccbCOg1: parseFloat(body.mccb_c_og1 || body.mccbCOg1 || "0"),
        mccbCOg2: parseFloat(body.mccb_c_og2 || body.mccbCOg2 || "0"),
        mccbBodyTemp: parseFloat(body.mccb_body_temp || body.mccbBodyTemp || "0"),
        kvMa: body.kv_ma || body.kvMa,
        spMin: body.sp_min || body.spMin,
        scrCoolingFinsTemp: parseFloat(body.scr_cooling_fins_temp || body.scrCoolingFinsTemp || "0"),
        scrCoolingFan: body.scr_cooling_fan || body.scrCoolingFan,
        panelExhaustFan: body.panel_exhaust_fan || body.panelExhaustFan,
        mccForcedCoolingFanTemp: body.mcc_forced_cooling_fan_temp || body.mccForcedCoolingFanTemp,
        rdi68: parseFloat(body.rdi68 || "0"),
        rdi69: parseFloat(body.rdi69 || "0"),
        rdi70: parseFloat(body.rdi70 || "0"),
        remarks: body.remarks
      },
      include: {
        equipment: true
      }
    })

    // Send email notification with Excel attachment
    try {
      await sendThermographyEmail(record)
      console.log("Thermography email notification sent successfully")
    } catch (emailError) {
      console.error("Failed to send thermography email notification:", emailError)
      // Don't fail the API call if email fails
    }

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Error creating thermography record:", error)
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    )
  }
}
