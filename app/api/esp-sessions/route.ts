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
    const { espCode, equipmentName, equipmentType, inspectionDate, month, doneBy, transformers, remarks } = body

    // Check if ESP equipment exists in equipment master, if not create it
    let equipment = await prisma.equipmentMaster.findUnique({
      where: { tagNo: espCode }
    })

    if (!equipment) {
      try {
        // Import QR generation utility
        const { generateQR } = await import('@/lib/qr-utils')
        
        // Create ESP equipment in equipment master if it doesn't exist
        equipment = await prisma.equipmentMaster.create({
          data: {
            tagNo: espCode,
            equipmentName: equipmentName || `ESP Equipment ${espCode}`,
            equipmentType: equipmentType || 'ESP (Electrostatic Precipitator)',
            location: 'Main Plant'
            // QR code will be generated after creation
          }
        })
        
        // Generate QR code for the new equipment
        try {
          const qrCodeDataUrl = await generateQR(equipment.id, 'equipment')
          
          // Update equipment with QR code
          equipment = await prisma.equipmentMaster.update({
            where: { id: equipment.id },
            data: { qrCode: qrCodeDataUrl }
          })
          
          console.log(`✅ Created new ESP equipment: ${espCode} - ${equipmentName} with QR code`)
        } catch (qrError) {
          console.error('❌ Failed to generate QR code for ESP equipment:', qrError)
          console.log(`⚠️ Created new ESP equipment: ${espCode} - ${equipmentName} (without QR code)`)
        }
      } catch (equipmentError) {
        console.error('❌ Failed to create ESP equipment:', equipmentError)
        throw new Error('Failed to create ESP equipment')
      }
    }

    // Ensure we always have 3 transformer records (TF1, TF2, TF3) for ESP
    const defaultTransformers = [
      { transformerNo: 'TF1', step: 1 },
      { transformerNo: 'TF2', step: 2 },
      { transformerNo: 'TF3', step: 3 }
    ]

    // Use provided transformers or default to empty TF1, TF2, TF3 records
    const espTransformers = (transformers && transformers.length > 0) 
      ? transformers 
      : defaultTransformers

    console.log(`📋 Creating ESP session with ${espTransformers.length} transformer records:`, 
      espTransformers.map((t: any) => t.transformerNo).join(', '))

    // Calculate completion status based on actual temperature data, not relay status
    const completedTransformers = espTransformers.filter((transformer: any) => {
      // Check if transformer has at least one meaningful temperature measurement
      return (
        (transformer.mccbIcRPhase && parseFloat(transformer.mccbIcRPhase) > 0) ||
        (transformer.mccbIcBPhase && parseFloat(transformer.mccbIcBPhase) > 0) ||
        (transformer.mccbCOg1 && parseFloat(transformer.mccbCOg1) > 0) ||
        (transformer.mccbCOg2 && parseFloat(transformer.mccbCOg2) > 0) ||
        (transformer.mccbBodyTemp && parseFloat(transformer.mccbBodyTemp) > 0) ||
        (transformer.scrCoolingFinsTemp && parseFloat(transformer.scrCoolingFinsTemp) > 0)
        // Note: RDI fields are relay status, not temperatures, so excluded from completion check
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
          create: espTransformers.map((transformer: any, index: number) => ({
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
            mccForcedCoolingFanTemp: transformer.mccForcedCoolingFanTemp || null,
            rdi68: transformer.rdi68 || null, // Relay status: "On" or "Off"
            rdi69: transformer.rdi69 || null, // Relay status: "On" or "Off"
            rdi70: transformer.rdi70 || null  // Relay status: "On" or "Off"
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