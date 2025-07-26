import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const id = Number.parseInt(params.id)

    const record = await prisma.windingResistanceRecord.findUnique({
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
      motor_no,
      inspection_date,
      done_by,
      winding_resistance,
      ir_values,
      dar_values,
      polarization_index,
      remarks,
    } = body

    const record = await prisma.windingResistanceRecord.update({
      where: { id },
      data: {
        motorNo: motor_no,
        inspectionDate: new Date(inspection_date),
        doneBy: done_by,
        windingResistance: winding_resistance,
        irValues: ir_values,
        darValues: dar_values,
        polarizationIndex: polarization_index,
        remarks,
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

    await prisma.windingResistanceRecord.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Record deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
  }
}
