import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const resolvedParams = await params
    const id = Number.parseInt(resolvedParams.id)

    const record = await prisma.espThermographySession.findUnique({
      where: { id },
      include: {
        transformerRecords: {
          orderBy: { step: 'asc' }
        }
      }
    })

    if (!record) {
      return NextResponse.json({ error: "Thermography record not found" }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch thermography record" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const resolvedParams = await params
    const id = Number.parseInt(resolvedParams.id)
    const body = await request.json()

    const { espCode, inspectionDate, month, doneBy, transformerRecords, remarks } = body

    const session = await prisma.espThermographySession.update({
      where: { id },
      data: {
        espCode,
        inspectionDate: new Date(inspectionDate),
        month,
        doneBy,
        remarks,
      },
      include: {
        transformerRecords: {
          orderBy: { step: 'asc' }
        }
      }
    })

    // Update transformer records if provided
    if (transformerRecords && Array.isArray(transformerRecords)) {
      // Delete existing transformer records
      await prisma.espTransformerRecord.deleteMany({
        where: { sessionId: id }
      })

      // Create new transformer records
      if (transformerRecords.length > 0) {
        await prisma.espTransformerRecord.createMany({
          data: transformerRecords.map((record: any) => ({
            sessionId: id,
            transformerNo: record.transformerNo,
            step: record.step,
            mccbIcRPhase: record.mccbIcRPhase,
            mccbIcBPhase: record.mccbIcBPhase,
            mccbCOg1: record.mccbCOg1,
            mccbCOg2: record.mccbCOg2,
            mccbBodyTemp: record.mccbBodyTemp,
            kvMa: record.kvMa,
            spMin: record.spMin,
            scrCoolingFinsTemp: record.scrCoolingFinsTemp,
            scrCoolingFan: record.scrCoolingFan,
            panelExhaustFan: record.panelExhaustFan,
            mccForcedCoolingFanTemp: record.mccForcedCoolingFanTemp,
            remark: record.remark || null
          }))
        })
      }
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update thermography record" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const resolvedParams = await params
    const id = Number.parseInt(resolvedParams.id)

    // Delete transformer records first (due to foreign key constraint)
    await prisma.espTransformerRecord.deleteMany({
      where: { sessionId: id }
    })

    // Delete the session
    await prisma.espThermographySession.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Thermography record deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete thermography record" }, { status: 500 })
  }
}
