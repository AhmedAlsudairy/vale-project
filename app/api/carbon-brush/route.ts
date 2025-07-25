import { NextResponse, type NextRequest } from "next/server"

// Mock data for when database is not available
const mockRecords = [
  {
    id: 1,
    tagNo: "BO.3161.04.M1",
    equipmentName: "Induration Fan Motor",
    brushType: "C80X",
    inspectionDate: "2024-01-15",
    workOrderNo: "WO-2024-001",
    doneBy: "John Smith",
    measurements: {
      "1A": 45.2,
      "1B": 44.8,
      "2A": 43.5,
      "2B": 44.1,
      "3A": 42.9,
      "3B": 43.7,
      "4A": 44.3,
      "4B": 43.8,
      "5A": 45.0,
      "5B": 44.5,
    },
    slipRingThickness: 12.5,
    slipRingIr: 2.3,
    remarks: "All measurements within acceptable range",
    createdAt: "2024-01-15T10:30:00Z",
    equipment: {
      equipmentName: "Induration Fan Motor",
    },
  },
]

export async function GET(request: NextRequest) {
  try {
    // Try to import and use Prisma
    const { prisma } = await import("@/lib/prisma")

    const { searchParams } = new URL(request.url)
    const tagNo = searchParams.get("tag_no")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const records = await prisma.carbonBrushRecord.findMany({
      where: tagNo ? { tagNo } : undefined,
      include: {
        equipment: {
          select: {
            equipmentName: true,
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
    const tagNo = searchParams.get("tag_no")

    let filteredRecords = mockRecords
    if (tagNo) {
      filteredRecords = mockRecords.filter((record) => record.tagNo === tagNo)
    }

    return NextResponse.json(filteredRecords)
  }
}

export async function POST(request: NextRequest) {
  let body
  try {
    const { prisma } = await import("@/lib/prisma")
    body = await request.json()

    const {
      tag_no,
      equipment_name,
      brush_type,
      inspection_date,
      work_order_no,
      done_by,
      measurements,
      slip_ring_thickness,
      slip_ring_ir,
      remarks,
    } = body

    // Ensure the equipment exists before creating a record
    await prisma.equipmentMaster.upsert({
      where: { tagNo: tag_no },
      update: { equipmentName: equipment_name },
      create: {
        tagNo: tag_no,
        equipmentName: equipment_name,
        equipmentType: "Motor", // Provide a default or derive
      },
    })

    const record = await prisma.carbonBrushRecord.create({
      data: {
        tagNo: tag_no,
        equipmentName: equipment_name,
        brushType: brush_type,
        inspectionDate: new Date(inspection_date),
        workOrderNo: work_order_no,
        doneBy: done_by,
        measurements,
        slipRingThickness: Number.parseFloat(slip_ring_thickness),
        slipRingIr: Number.parseFloat(slip_ring_ir),
        remarks,
      },
      include: {
        equipment: {
          select: {
            equipmentName: true,
          },
        },
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("Database error:", error)

    // Avoid re-reading the body if it has already been read
    if (!body) {
      try {
        body = await request.json()
      } catch (parseError) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
      }
    }

    const mockRecord = {
      id: Date.now(),
      tagNo: body.tag_no,
      equipmentName: body.equipment_name,
      brushType: body.brush_type,
      inspectionDate: body.inspection_date,
      workOrderNo: body.work_order_no,
      doneBy: body.done_by,
      measurements: body.measurements,
      slipRingThickness: Number.parseFloat(body.slip_ring_thickness),
      slipRingIr: Number.parseFloat(body.slip_ring_ir),
      remarks: body.remarks,
      createdAt: new Date().toISOString(),
      equipment: {
        equipmentName: body.equipment_name,
      },
    }

    return NextResponse.json(mockRecord)
  }
}
