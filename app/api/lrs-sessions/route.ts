import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET all LRS sessions
export async function GET() {
  try {
    const sessions = await prisma.lrsThermographySession.findMany({
      include: {
        temperatureRecords: {
          orderBy: {
            id: 'asc'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching LRS sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LRS sessions' },
      { status: 500 }
    )
  }
}

// POST new LRS session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      tagNumber,
      equipmentName,
      equipmentType,
      numberOfPoints,
      temperatureRecords,
      previewImage,
      images,
      inspector
    } = body

    // Validate required fields
    if (!tagNumber || !equipmentName || !numberOfPoints) {
      return NextResponse.json(
        { error: 'Missing required fields: tagNumber, equipmentName, numberOfPoints' },
        { status: 400 }
      )
    }

    // Check if equipment exists in EquipmentMaster, if not create it
    let equipment = await prisma.equipmentMaster.findUnique({
      where: { tagNo: tagNumber }
    })

    if (!equipment) {
      // Create equipment in master table
      equipment = await prisma.equipmentMaster.create({
        data: {
          tagNo: tagNumber,
          equipmentName,
          equipmentType,
          location: 'Auto-added from LRS Thermography'
        }
      })
    }

    // Create session with or without temperature records
    const sessionData: any = {
      tagNumber,
      equipmentName,
      equipmentType,
      numberOfPoints,
      previewImage,
      images: images || [],
      inspector
    }

    // Add temperature records if provided
    if (temperatureRecords && temperatureRecords.length > 0) {
      sessionData.temperatureRecords = {
        create: temperatureRecords.map((record: any) => ({
          point: record.point,
          description: record.description,
          temperature: record.temperature,
          status: record.status
        }))
      }
    }

    const session = await prisma.lrsThermographySession.create({
      data: sessionData,
      include: {
        temperatureRecords: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating LRS session:', error)
    return NextResponse.json(
      { error: 'Failed to create LRS session' },
      { status: 500 }
    )
  }
}
