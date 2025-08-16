import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const resolvedParams = await params
    const id = Number.parseInt(resolvedParams.id)

    const session = await prisma.espThermographySession.findUnique({
      where: { id },
      include: {
        transformerRecords: {
          orderBy: { step: 'asc' }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: "ESP session not found" }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch ESP session" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const resolvedParams = await params
    const id = Number.parseInt(resolvedParams.id)
    const body = await request.json()

    const { espCode, inspectionDate, month, doneBy, transformers, remarks } = body

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
    if (transformers && Array.isArray(transformers)) {
      // Delete existing transformer records
      await prisma.espTransformerRecord.deleteMany({
        where: { sessionId: id }
      })

      // Create new transformer records
      if (transformers.length > 0) {
        await prisma.espTransformerRecord.createMany({
          data: transformers.map((transformer: any, index: number) => ({
            sessionId: id,
            transformerNo: transformer.transformerNo || `TF${index + 1}`,
            step: transformer.step,
            mccbIcRPhase: transformer.mccbIcRPhase,
            mccbIcBPhase: transformer.mccbIcBPhase,
            mccbCOg1: transformer.mccbCOg1,
            mccbCOg2: transformer.mccbCOg2,
            mccbBodyTemp: transformer.mccbBodyTemp,
            kvMa: transformer.kvMa,
            spMin: transformer.spMin,
            scrCoolingFinsTemp: transformer.scrCoolingFinsTemp,
            scrCoolingFan: transformer.scrCoolingFan,
            panelExhaustFan: transformer.panelExhaustFan,
            mccForcedCoolingFanTemp: transformer.mccForcedCoolingFanTemp,
            remark: transformer.remark || null
          }))
        })
      }
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update ESP session" }, { status: 500 })
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

    return NextResponse.json({ message: "ESP session deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete ESP session" }, { status: 500 })
  }
}
