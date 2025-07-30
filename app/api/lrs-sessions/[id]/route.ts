import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET single LRS session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = parseInt(params.id)
    
    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      )
    }

    const session = await prisma.lrsThermographySession.findUnique({
      where: { id: sessionId },
      include: {
        temperatureRecords: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching LRS session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LRS session' },
      { status: 500 }
    )
  }
}

// PUT update LRS session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = parseInt(params.id)
    
    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    const {
      tagNumber,
      equipmentName,
      equipmentType,
      numberOfPoints,
      temperatureRecords,
      previewImage,
      inspector
    } = body

    // Check if session exists
    const existingSession = await prisma.lrsThermographySession.findUnique({
      where: { id: sessionId },
      include: {
        temperatureRecords: true
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Update equipment in master table if needed
    if (tagNumber && equipmentName) {
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
      } else {
        // Update existing equipment
        await prisma.equipmentMaster.update({
          where: { tagNo: tagNumber },
          data: {
            equipmentName,
            equipmentType
          }
        })
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (tagNumber !== undefined) updateData.tagNumber = tagNumber
    if (equipmentName !== undefined) updateData.equipmentName = equipmentName
    if (equipmentType !== undefined) updateData.equipmentType = equipmentType
    if (numberOfPoints !== undefined) updateData.numberOfPoints = numberOfPoints
    if (previewImage !== undefined) updateData.previewImage = previewImage
    if (inspector !== undefined) updateData.inspector = inspector

    // Handle temperature records update
    if (temperatureRecords && Array.isArray(temperatureRecords)) {
      // Instead of deleting all, we'll append new non-zero temperature records
      // Only create records that have meaningful temperature values (> 0)
      const newRecordsToAdd = temperatureRecords.filter((record: any) => 
        record.temperature && record.temperature > 0
      )

      if (newRecordsToAdd.length > 0) {
        // Create new temperature records (append to existing ones)
        updateData.temperatureRecords = {
          create: newRecordsToAdd.map((record: any) => ({
            point: record.point,
            description: record.description,
            temperature: record.temperature,
            status: record.status || 'Normal'
          }))
        }
      }
    }

    // Update the session
    const updatedSession = await prisma.lrsThermographySession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        temperatureRecords: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Error updating LRS session:', error)
    return NextResponse.json(
      { error: 'Failed to update LRS session' },
      { status: 500 }
    )
  }
}

// DELETE LRS session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = parseInt(params.id)
    
    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      )
    }

    // Check if session exists
    const existingSession = await prisma.lrsThermographySession.findUnique({
      where: { id: sessionId }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Delete temperature records first (cascade should handle this, but being explicit)
    await prisma.lrsTemperatureRecord.deleteMany({
      where: { sessionId: sessionId }
    })

    // Delete the session
    await prisma.lrsThermographySession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json(
      { message: 'Session deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting LRS session:', error)
    return NextResponse.json(
      { error: 'Failed to delete LRS session' },
      { status: 500 }
    )
  }
}
