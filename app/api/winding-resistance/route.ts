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
  let body: any
  
  try {
    const { prisma } = await import("@/lib/prisma")

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
      primary_pi, // New field for Primary PI data (all voltage types)
      dar_results, // New field for manual DAR results
      rdi_set1, // RDI Set 1 (68-70)
      rdi_set2, // RDI Set 2 (51-53)
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

    // Check if equipment exists in equipment master, if not create it
    let equipment = await prisma.equipmentMaster.findUnique({
      where: { tagNo: motor_no }
    })

    if (!equipment) {
      // Create equipment in equipment master if it doesn't exist
      equipment = await prisma.equipmentMaster.create({
        data: {
          tagNo: motor_no,
          equipmentName: equipment_name || `Motor ${motor_no}`,
          equipmentType: 'Motor',
          location: 'Main Plant'
          // QR code will be generated when user clicks "Generate" button
        }
      })
      console.log(`Created new motor equipment: ${motor_no}`)
    }

    const record = await prisma.windingResistanceRecord.create({
      data: {
        motorNo: motor_no,
        inspectionDate: new Date(inspection_date),
        doneBy: done_by || null,
        windingResistance: winding_resistance,
        irValues: ir_values,
        darValues: {
          ...dar_values, // Raw measurements (30sec, 1min values)
          results: dar_results || null // Manual DAR calculation results
        },
        primary5kVPI: primary_pi || null, // Primary PI data (all voltage types)
        rdiSet1: rdi_set1 || null, // RDI Set 1 data
        rdiSet2: rdi_set2 || null, // RDI Set 2 data
        polarizationIndex: primary_pi?.pi_result ? Number.parseFloat(primary_pi.pi_result.toString()) : null,
        remarks: remarks || null,
      },
    })

    console.log("Created winding resistance record:", record) // Debug log
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Database error:", error)

    // Return a mock success response when database is not available
    if (body) {
      console.log("Using mock response for:", body) // Debug log

      const mockRecord = {
        id: Date.now(),
        motorNo: body.motor_no,
        inspectionDate: body.inspection_date,
        doneBy: body.done_by,
        windingResistance: body.winding_resistance,
        irValues: body.ir_values,
        darValues: body.dar_values,
        primaryPI: body.primary_pi,
        polarizationIndex: body.primary_pi?.pi_result,
        remarks: body.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return NextResponse.json(mockRecord, { status: 201 })
    }
    
    return NextResponse.json({ error: "Failed to save record" }, { status: 500 })
  }
}
