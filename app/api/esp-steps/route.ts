import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const { prisma } = await import("@/lib/prisma")

    const transformerRecords = await prisma.espTransformerRecord.findMany({
      where: { sessionId: Number.parseInt(sessionId) },
      orderBy: { step: 'asc' }
    })

    return NextResponse.json(transformerRecords)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch ESP steps" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma")
    const body = await request.json()
    
    const { sessionId, transformerRecords } = body

    if (!sessionId || !transformerRecords || !Array.isArray(transformerRecords)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Delete existing transformer records for this session
    await prisma.espTransformerRecord.deleteMany({
      where: { sessionId: Number.parseInt(sessionId) }
    })

    // Create new transformer records
    if (transformerRecords.length > 0) {
      const createdRecords = await prisma.espTransformerRecord.createMany({
        data: transformerRecords.map((record: any) => ({
          sessionId: Number.parseInt(sessionId),
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

      return NextResponse.json({ 
        message: "ESP steps saved successfully", 
        count: createdRecords.count 
      })
    }

    return NextResponse.json({ message: "No steps to save" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to save ESP steps" }, { status: 500 })
  }
}
