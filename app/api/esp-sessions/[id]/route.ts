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

    const { espCode, equipmentName, equipmentType, inspectionDate, month, doneBy, transformers, mccForcedCoolingFanTemp, remarks } = body

    console.log('Updating ESP session:', id, 'with transformers:', transformers?.length || 0)

    // Calculate completion status based on actual temperature data
    const completedTransformers = (transformers || []).filter((transformer: any) => {
      // Check if transformer has at least one meaningful temperature measurement
      return (
        (transformer.mccbIcRPhase && parseFloat(transformer.mccbIcRPhase) > 0) ||
        (transformer.mccbIcBPhase && parseFloat(transformer.mccbIcBPhase) > 0) ||
        (transformer.mccbCOg1 && parseFloat(transformer.mccbCOg1) > 0) ||
        (transformer.mccbCOg2 && parseFloat(transformer.mccbCOg2) > 0) ||
        (transformer.mccbBodyTemp && parseFloat(transformer.mccbBodyTemp) > 0) ||
        (transformer.scrCoolingFinsTemp && parseFloat(transformer.scrCoolingFinsTemp) > 0)
      )
    }).length

    console.log('Completed transformers:', completedTransformers)

    const session = await prisma.espThermographySession.update({
      where: { id },
      data: {
        espCode,
        inspectionDate: new Date(inspectionDate),
        month: parseInt(month),
        doneBy,
        mccForcedCoolingFanTemp,
        step: Math.max(1, completedTransformers),
        isCompleted: completedTransformers === 3,
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

      // Ensure we always have 3 transformer records (TF1, TF2, TF3) for ESP
      const defaultTransformers = [
        { transformerNo: 'TF1', step: 1 },
        { transformerNo: 'TF2', step: 2 },
        { transformerNo: 'TF3', step: 3 }
      ]

      // Use provided transformers or default to empty TF1, TF2, TF3 records
      const espTransformers = transformers.length > 0 ? transformers : defaultTransformers

      // Create new transformer records
      if (espTransformers.length > 0) {
        await prisma.espTransformerRecord.createMany({
          data: espTransformers.map((transformer: any, index: number) => ({
            sessionId: id,
            transformerNo: transformer.transformerNo || `TF${index + 1}`,
            step: index + 1,
            mccbIcRPhase: parseFloat(transformer.mccbIcRPhase) || null,
            mccbIcBPhase: parseFloat(transformer.mccbIcBPhase) || null,
            mccbCOg1: parseFloat(transformer.mccbCOg1) || null,
            mccbCOg2: parseFloat(transformer.mccbCOg2) || null,
            mccbBodyTemp: parseFloat(transformer.mccbBodyTemp) || null,
            kvMa: transformer.kvMa || null,
            spMin: transformer.spMin || null,
            scrCoolingFinsTemp: parseFloat(transformer.scrCoolingFinsTemp) || null,
            scrCoolingFan: transformer.scrCoolingFan || null,
            panelExhaustFan: transformer.panelExhaustFan || null,
            rdi68: transformer.rdi68 || null,
            rdi69: transformer.rdi69 || null,
            rdi70: transformer.rdi70 || null,
            rdi51: transformer.rdi51 || null,
            rdi52: transformer.rdi52 || null,
            rdi53: transformer.rdi53 || null,
            remark: transformer.remark || null
          }))
        })
        console.log('Created', espTransformers.length, 'transformer records for session', id)
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
