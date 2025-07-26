import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const id = Number.parseInt(params.id)

    const record = await prisma.carbonBrushRecord.findUnique({
      where: { id },
      include: {
        equipment: {
          select: {
            equipmentName: true,
            equipmentType: true,
          },
        },
      },
    })

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error("Database error:", error)

    // Return mock data when database is not available
    const mockRecord = {
      id: Number.parseInt(params.id),
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
    }

    return NextResponse.json(mockRecord)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const id = Number.parseInt(params.id)
    const body = await request.json()

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

    const record = await prisma.carbonBrushRecord.update({
      where: { id },
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
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const id = Number.parseInt(params.id)

    await prisma.carbonBrushRecord.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Record deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
  }
}
