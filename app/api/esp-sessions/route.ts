import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tagNo = searchParams.get('tagNo')
    
    const whereClause = tagNo ? { espCode: tagNo } : {}
    
    const sessions = await prisma.espThermographySession.findMany({
      where: whereClause,
      include: {
        transformerRecords: {
          orderBy: { step: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching ESP sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch ESP sessions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { espCode, inspectionDate, month, doneBy, transformers, remarks } = body

    // Check if ESP equipment exists in equipment master, if not create it
    let equipment = await prisma.equipmentMaster.findUnique({
      where: { tagNo: espCode }
    })

    if (!equipment) {
      // Create ESP equipment in equipment master if it doesn't exist
      equipment = await prisma.equipmentMaster.create({
        data: {
          tagNo: espCode,
          equipmentName: `ESP Equipment ${espCode}`,
          equipmentType: 'ESP (Electrostatic Precipitator)',
          location: 'Main Plant'
          // QR code will be generated when user clicks "Generate" button
        }
      })
      console.log(`Created new ESP equipment: ${espCode}`)
    }

    // Calculate completion status based on actual data, not just transformer count
    const completedTransformers = transformers.filter((transformer: any) => {
      // Check if transformer has at least one meaningful measurement
      return (
        (transformer.mccbIcRPhase && parseFloat(transformer.mccbIcRPhase) > 0) ||
        (transformer.mccbIcBPhase && parseFloat(transformer.mccbIcBPhase) > 0) ||
        (transformer.mccbCOg1 && parseFloat(transformer.mccbCOg1) > 0) ||
        (transformer.mccbCOg2 && parseFloat(transformer.mccbCOg2) > 0) ||
        (transformer.mccbBodyTemp && parseFloat(transformer.mccbBodyTemp) > 0) ||
        (transformer.scrCoolingFinsTemp && parseFloat(transformer.scrCoolingFinsTemp) > 0) ||
        (transformer.rdi68 && parseFloat(transformer.rdi68) > 0) ||
        (transformer.rdi69 && parseFloat(transformer.rdi69) > 0) ||
        (transformer.rdi70 && parseFloat(transformer.rdi70) > 0)
      )
    }).length

    const session = await prisma.espThermographySession.create({
      data: {
        espCode,
        inspectionDate: new Date(inspectionDate),
        month: parseInt(month),
        doneBy,
        step: Math.max(1, completedTransformers), // Ensure step is at least 1
        isCompleted: completedTransformers === 3, // Only completed when ALL 3 transformers have actual data
        remarks,
        transformerRecords: {
          create: transformers.map((transformer: any, index: number) => ({
            transformerNo: transformer.transformerNo,
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
            mccForcedCoolingFanTemp: transformer.mccForcedCoolingFanTemp || null,
            rdi68: parseFloat(transformer.rdi68) || null,
            rdi69: parseFloat(transformer.rdi69) || null,
            rdi70: parseFloat(transformer.rdi70) || null
          }))
        }
      },
      include: {
        transformerRecords: true
      }
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating ESP session:', error)
    return NextResponse.json(
      { error: 'Failed to create ESP session' },
      { status: 500 }
    )
  }
}