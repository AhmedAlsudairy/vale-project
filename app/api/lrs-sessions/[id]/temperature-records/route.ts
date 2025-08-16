import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionId = parseInt(id)
    const body = await request.json()

    console.log('🔧 DEBUG - Adding temperature record to session:', sessionId)
    console.log('🔧 DEBUG - Temperature record data:', body)

    // Validate required fields
    if (!body.point || body.temperature === undefined || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: point, temperature, status' },
        { status: 400 }
      )
    }

    // Verify session exists
    const session = await prisma.lrsThermographySession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'LRS session not found' },
        { status: 404 }
      )
    }

    // Create temperature record
    const temperatureRecord = await prisma.lrsTemperatureRecord.create({
      data: {
        point: body.point,
        description: body.description || '',
        temperature: parseFloat(body.temperature),
        status: body.status,
        inspector: body.inspector || '',
        remark: body.remark || '',
        sessionId: sessionId,
      }
    })

    console.log('🔧 DEBUG - Temperature record created:', temperatureRecord)

    return NextResponse.json(temperatureRecord, { status: 201 })
  } catch (error) {
    console.error('Error adding temperature record:', error)
    return NextResponse.json(
      { error: 'Failed to add temperature record' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionId = parseInt(id)

    // Get all temperature records for this session
    const temperatureRecords = await prisma.lrsTemperatureRecord.findMany({
      where: { sessionId: sessionId },
      orderBy: { id: 'asc' }
    })

    return NextResponse.json(temperatureRecords)
  } catch (error) {
    console.error('Error fetching temperature records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch temperature records' },
      { status: 500 }
    )
  }
}