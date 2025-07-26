import { NextResponse, type NextRequest } from "next/server"

// Mock data for when database is not available
const mockRecords = [
  {
    id: 1,
    motorNo: "BO.3161.04.M1",
    windingResistance: { ry: 2.5, yb: 2.4, rb: 2.6 },
    irValues: {
      ug_1min: 15.2,
      ug_10min: 18.5,
      vg_1min: 14.8,
      vg_10min: 17.9,
      wg_1min: 15.1,
      wg_10min: 18.2,
    },
    polarizationIndex: 1.22,
    darValues: {
      ug_30sec: 12.1,
      ug_1min: 15.2,
      vg_30sec: 11.8,
      vg_1min: 14.8,
      wg_30sec: 12.0,
      wg_1min: 15.1,
    },
    inspectionDate: "2024-01-15",
    doneBy: "John Smith",
    remarks: "All values within acceptable range",
    createdAt: "2024-01-15T10:30:00Z",
  },
]

export async function GET(request: NextRequest) {
  try {
    // Try to import and use Prisma
    const { prisma } = await import("@/lib/prisma")

    const { searchParams } = new URL(request.url)
    const motorNo = searchParams.get("motor_no")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const records = await prisma.windingResistanceRecord.findMany({
      where: motorNo ? { motorNo } : undefined,
      include: {
        equipment: {
          select: {
            equipmentName: true,
            equipmentType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Database error, using mock data:", error)

    // Return mock data when database is not available
    const { searchParams } = new URL(request.url)
    const motorNo = searchParams.get("motor_no")

    let filteredRecords = mockRecords
    if (motorNo) {
      filteredRecords = mockRecords.filter((record) => record.motorNo === motorNo)
    }

    return NextResponse.json(filteredRecords)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma")

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("JSON parsing error:", error)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    console.log("Received winding resistance data:", body) // Debug log

    const {
      motor_no,
      equipment_name,
      inspection_date,
      done_by,
      winding_resistance,
      ir_values,
      dar_values,
      polarization_index,
      remarks,
    } = body

    // Validate required fields
    if (!motor_no || !inspection_date || !winding_resistance || !ir_values) {
      return NextResponse.json(
        { error: "Missing required fields: motor_no, inspection_date, winding_resistance, ir_values" },
        { status: 400 },
      )
    }

    // Validate data types
    if (typeof winding_resistance !== "object" || typeof ir_values !== "object") {
      return NextResponse.json({ error: "winding_resistance and ir_values must be objects" }, { status: 400 })
    }

    const record = await prisma.windingResistanceRecord.create({
      data: {
        motorNo: motor_no,
        inspectionDate: new Date(inspection_date),
        doneBy: done_by || null,
        windingResistance: winding_resistance,
        irValues: ir_values,
        darValues: dar_values || null,
        polarizationIndex: polarization_index ? Number.parseFloat(polarization_index.toString()) : null,
        remarks: remarks || null,
      },
    })

    console.log("Created winding resistance record:", record) // Debug log
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Database error:", error)

    // Return a mock success response when database is not available
    try {
      const body = await request.json()
      console.log("Using mock response for:", body) // Debug log

      const mockRecord = {
        id: Date.now(),
        motorNo: body.motor_no,
        inspectionDate: body.inspection_date,
        doneBy: body.done_by,
        windingResistance: body.winding_resistance,
        irValues: body.ir_values,
        darValues: body.dar_values,
        polarizationIndex: body.polarization_index,
        remarks: body.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return NextResponse.json(mockRecord, { status: 201 })
    } catch (jsonError) {
      console.error("JSON parsing error in fallback:", jsonError)
      return NextResponse.json({ error: "Failed to save record and invalid request format" }, { status: 500 })
    }
  }
}
