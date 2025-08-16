import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const resolvedParams = await params
    const id = Number.parseInt(resolvedParams.id)

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
    return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const resolvedParams = await params
    const id = Number.parseInt(resolvedParams.id)
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const resolvedParams = await params
    const id = Number.parseInt(resolvedParams.id)

    await prisma.carbonBrushRecord.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Record deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
  }
}
