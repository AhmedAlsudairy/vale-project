import { NextResponse, type NextRequest } from "next/server"
import { sendWindingResistanceEmail } from "@/lib/email"

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
      work_holder,
      winding_resistance,
      winding_resistance_units,
      ir_values,
      ir_values_units,
      dar_values,
      dar_values_units,
      primary_pi, // New field for Primary PI data (all voltage types)
      dar_results, // New field for manual DAR results
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
        workHolder: work_holder || null,
        windingResistance: {
          values: winding_resistance,
          units: winding_resistance_units || { ry: "Ω", yb: "Ω", rb: "Ω" }
        },
        irValues: {
          values: ir_values,
          units: ir_values_units || { ug_1min: "GΩ", ug_10min: "GΩ", vg_1min: "GΩ", vg_10min: "GΩ", wg_1min: "GΩ", wg_10min: "GΩ" }
        },
        darValues: {
          values: dar_values, // Raw measurements (30sec, 1min values)
          units: dar_values_units || { ug_30sec: "GΩ", ug_1min: "GΩ", vg_30sec: "GΩ", vg_1min: "GΩ", wg_30sec: "GΩ", wg_1min: "GΩ" },
          results: dar_results || null // Manual DAR calculation results
        },
        primary5kVPI: primary_pi || null, // Primary PI data (all voltage types)
        polarizationIndex: primary_pi?.pi_result ? Number.parseFloat(primary_pi.pi_result.toString()) : null,
        remarks: remarks || null,
      },
      include: {
        equipment: {
          select: {
            equipmentName: true,
            equipmentType: true,
          },
        },
      },
    })

    console.log("Created winding resistance record:", record) // Debug log
    
    // Send email notification with Excel attachment
    try {
      await sendWindingResistanceEmail(record)
      console.log("Email notification sent successfully")
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError)
      // Don't fail the API call if email fails
    }
    
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
        workHolder: body.work_holder,
        windingResistance: {
          values: body.winding_resistance,
          units: body.winding_resistance_units
        },
        irValues: {
          values: body.ir_values,
          units: body.ir_values_units
        },
        darValues: {
          values: body.dar_values,
          units: body.dar_values_units,
          results: body.dar_results
        },
        primaryPI: body.primary_pi,
        polarizationIndex: body.primary_pi?.pi_result,
        remarks: body.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Send email notification with Excel attachment (mock mode)
      try {
        // Add equipment info to mock record for email
        const mockRecordWithEquipment = {
          ...mockRecord,
          equipment: {
            equipmentName: body.equipment_name || `Motor ${body.motor_no}`,
            equipmentType: 'Motor'
          }
        }
        await sendWindingResistanceEmail(mockRecordWithEquipment)
        console.log("Email notification sent successfully (mock mode)")
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError)
        // Don't fail the API call if email fails
      }

      return NextResponse.json(mockRecord, { status: 201 })
    }
    
    return NextResponse.json({ error: "Failed to save record" }, { status: 500 })
  }
}
