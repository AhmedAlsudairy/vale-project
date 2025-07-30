import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateTemperatureRecordData {
  sessionId: number
  point: string
  description: string
  temperature: number
  status: 'Normal' | 'Warning' | 'Critical'
  inspector?: string
}

export interface UpdateTemperatureRecordData {
  point?: string
  description?: string
  temperature?: number
  status?: 'Normal' | 'Warning' | 'Critical'
  inspector?: string
}

/**
 * Insert a new temperature record for an LRS session
 */
export async function insertLrsTemperatureRecord(data: CreateTemperatureRecordData) {
  try {
    // Verify session exists
    const session = await prisma.lrsThermographySession.findUnique({
      where: { id: data.sessionId }
    })

    if (!session) {
      throw new Error(`LRS session with ID ${data.sessionId} not found`)
    }

    const temperatureRecord = await prisma.lrsTemperatureRecord.create({
      data: {
        sessionId: data.sessionId,
        point: data.point,
        description: data.description,
        temperature: data.temperature,
        status: data.status,
        inspector: data.inspector
      }
    })

    return temperatureRecord
  } catch (error) {
    console.error('Error inserting LRS temperature record:', error)
    throw error
  }
}

/**
 * Insert multiple temperature records for an LRS session
 */
export async function insertMultipleLrsTemperatureRecords(
  sessionId: number, 
  records: Omit<CreateTemperatureRecordData, 'sessionId'>[]
) {
  try {
    // Verify session exists
    const session = await prisma.lrsThermographySession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      throw new Error(`LRS session with ID ${sessionId} not found`)
    }

    const temperatureRecords = await prisma.lrsTemperatureRecord.createMany({
      data: records.map(record => ({
        sessionId,
        point: record.point,
        description: record.description,
        temperature: record.temperature,
        status: record.status,
        inspector: record.inspector
      }))
    })

    return temperatureRecords
  } catch (error) {
    console.error('Error inserting multiple LRS temperature records:', error)
    throw error
  }
}

/**
 * Update an existing temperature record
 */
export async function updateLrsTemperatureRecord(
  recordId: number,
  data: UpdateTemperatureRecordData
) {
  try {
    const updatedRecord = await prisma.lrsTemperatureRecord.update({
      where: { id: recordId },
      data
    })

    return updatedRecord
  } catch (error) {
    console.error('Error updating LRS temperature record:', error)
    throw error
  }
}

/**
 * Get all temperature records for a session
 */
export async function getLrsTemperatureRecords(sessionId: number) {
  try {
    const records = await prisma.lrsTemperatureRecord.findMany({
      where: { sessionId },
      orderBy: { id: 'asc' }
    })

    return records
  } catch (error) {
    console.error('Error fetching LRS temperature records:', error)
    throw error
  }
}

/**
 * Get temperature record statistics for a session
 */
export async function getLrsTemperatureStats(sessionId: number) {
  try {
    const records = await prisma.lrsTemperatureRecord.findMany({
      where: { sessionId }
    })

    const stats = {
      total: records.length,
      normal: records.filter(r => r.status === 'Normal').length,
      warning: records.filter(r => r.status === 'Warning').length,
      critical: records.filter(r => r.status === 'Critical').length,
      averageTemperature: records.length > 0 
        ? records.reduce((sum, r) => sum + r.temperature, 0) / records.length 
        : 0,
      maxTemperature: records.length > 0 
        ? Math.max(...records.map(r => r.temperature)) 
        : 0,
      minTemperature: records.length > 0 
        ? Math.min(...records.map(r => r.temperature)) 
        : 0
    }

    return stats
  } catch (error) {
    console.error('Error calculating LRS temperature stats:', error)
    throw error
  }
}

/**
 * Delete a temperature record
 */
export async function deleteLrsTemperatureRecord(recordId: number) {
  try {
    await prisma.lrsTemperatureRecord.delete({
      where: { id: recordId }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting LRS temperature record:', error)
    throw error
  }
}

/**
 * Create an LRS session with temperature records in a single transaction
 */
export async function createLrsSessionWithRecords(
  sessionData: {
    tagNumber: string
    equipmentName: string
    equipmentType: string
    numberOfPoints: number
    previewImage?: string
  },
  temperatureRecords: Omit<CreateTemperatureRecordData, 'sessionId'>[]
) {
  try {
    const session = await prisma.lrsThermographySession.create({
      data: {
        ...sessionData,
        temperatureRecords: {
          create: temperatureRecords.map(record => ({
            point: record.point,
            description: record.description,
            temperature: record.temperature,
            status: record.status,
            inspector: record.inspector
          }))
        }
      },
      include: {
        temperatureRecords: {
          orderBy: { id: 'asc' }
        }
      }
    })

    return session
  } catch (error) {
    console.error('Error creating LRS session with records:', error)
    throw error
  }
}
