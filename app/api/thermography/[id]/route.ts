import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const id = Number.parseInt(params.id)

    const record = await prisma.thermographyRecord.findUnique({
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
      transformerNo: "TF1",
      equipmentType: "ESP",
      inspectionDate: "2024-01-15",
      month: 1,
      doneBy: "John Smith",
      mccbIcRPhase: 45.2,
      mccbIcBPhase: 46.8,
      mccbCOg1: 43.5,
      mccbCOg2: 44.1,
      mccbBodyTemp: 42.9,
      kvMa: "55.5",
      spMin: "1800",
      scrCoolingFinsTemp: 65.3,
      scrCoolingFan: "38.8",
      panelExhaustFan: "35.0",
      mccForcedCoolingFanTemp: "40.5",
      rdi68: 12.3,
      rdi69: 13.1,
      rdi70: 14.2,
      remarks: "All temperatures within normal range",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
      equipment: {
        equipmentName: "ESP Transformer 1",
        equipmentType: "ESP"
      }
    }

    return NextResponse.json(mockRecord)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { prisma } = await import("@/lib/prisma")
    const body = await request.json()

    const id = Number.parseInt(params.id)

    const {
      transformerNo,
      inspectionDate,
      month,
      doneBy,
      mccbIcRPhase,
      mccbIcBPhase,
      mccbCOg1,
      mccbCOg2,
      mccbBodyTemp,
      kvMa,
      spMin,
      scrCoolingFinsTemp,
      scrCoolingFan,
      panelExhaustFan,
      mccForcedCoolingFanTemp,
      rdi68,
      rdi69,
      rdi70,
      remarks
    } = body

    const record = await prisma.thermographyRecord.update({
      where: { id },
      data: {
        transformerNo,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : undefined,
        month: month ? Number.parseInt(month) : undefined,
        doneBy,
        mccbIcRPhase: mccbIcRPhase ? Number.parseFloat(mccbIcRPhase) : undefined,
        mccbIcBPhase: mccbIcBPhase ? Number.parseFloat(mccbIcBPhase) : undefined,
        mccbCOg1: mccbCOg1 ? Number.parseFloat(mccbCOg1) : undefined,
        mccbCOg2: mccbCOg2 ? Number.parseFloat(mccbCOg2) : undefined,
        mccbBodyTemp: mccbBodyTemp ? Number.parseFloat(mccbBodyTemp) : undefined,
        kvMa,
        spMin,
        scrCoolingFinsTemp: scrCoolingFinsTemp ? Number.parseFloat(scrCoolingFinsTemp) : undefined,
        scrCoolingFan,
        panelExhaustFan,
        mccForcedCoolingFanTemp,
        rdi68: rdi68 ? Number.parseFloat(rdi68) : undefined,
        rdi69: rdi69 ? Number.parseFloat(rdi69) : undefined,
        rdi70: rdi70 ? Number.parseFloat(rdi70) : undefined,
        remarks,
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

    return NextResponse.json(record)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to update thermography record" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const id = Number.parseInt(params.id)

    await prisma.thermographyRecord.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Record deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to delete thermography record" },
      { status: 500 }
    )
  }
}
