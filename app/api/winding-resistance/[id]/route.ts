import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const resolvedParams = await params
    const id = Number.parseInt(resolvedParams.id)

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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const resolvedParams = await params
    const id = Number.parseInt(resolvedParams.id)

    await prisma.windingResistanceRecord.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Record deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
  }
}
