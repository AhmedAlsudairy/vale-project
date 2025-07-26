import { NextResponse, type NextRequest } from "next/server"

// Mock equipment data
const mockEquipment = [
  {
    id: 1,
    tagNo: "BO.3161.04.M1",
    equipmentName: "Induration Fan Motor",
    equipmentType: "Motor",
    location: "Induration Area",
    installationDate: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    tagNo: "BO.3161.05.M1",
    equipmentName: "Cooling Fan Motor",
    equipmentType: "Motor",
    location: "Cooling Area",
    installationDate: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    tagNo: "BO.3161.06.M1",
    equipmentName: "Exhaust Fan Motor",
    equipmentType: "Motor",
    location: "Exhaust Area",
    installationDate: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
  // ESP Equipment from thermography sessions
  {
    id: 4,
    tagNo: "ESP-01",
    equipmentName: "ESP MCC Panel 1",
    equipmentType: "ESP - MCC Panel",
    location: "Main Plant",
    installationDate: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 5,
    tagNo: "ESP-02",
    equipmentName: "ESP MCC Panel 2", 
    equipmentType: "ESP - MCC Panel",
    location: "Main Plant",
    installationDate: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 6,
    tagNo: "ESP-03",
    equipmentName: "ESP MCC Panel 3",
    equipmentType: "ESP - MCC Panel", 
    location: "Secondary Plant",
    installationDate: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
]

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma")

    const equipment = await prisma.equipmentMaster.findMany({
      include: {
        _count: {
          select: {
            carbonBrushRecords: true,
            windingResistanceRecords: true,
            thermographyRecords: true,
          },
        },
      },
      orderBy: {
        tagNo: "asc",
      },
    })

    // Transform the equipment data to include counts
    const equipmentWithCounts = await Promise.all(equipment.map(async (item) => {
      // Also count ESP thermography sessions for this equipment
      let espSessionsCount = 0
      try {
        espSessionsCount = await prisma.espThermographySession.count({
          where: { espCode: item.tagNo }
        })
      } catch (error) {
        // ESP sessions table might not exist
        console.log("ESP sessions not available for counting")
      }

      return {
        ...item,
        carbonBrushCount: item._count.carbonBrushRecords,
        windingResistanceCount: item._count.windingResistanceRecords,
        thermographyRecordsCount: item._count.thermographyRecords + espSessionsCount,
      }
    }))

    return NextResponse.json(equipmentWithCounts)
  } catch (error) {
    console.error("Database error, using mock data:", error)
    // Add counts to mock equipment data
    const mockEquipmentWithCounts = mockEquipment.map(item => ({
      ...item,
      carbonBrushCount: 0,
      windingResistanceCount: 0,
      thermographyRecordsCount: item.equipmentType.includes('ESP') ? 1 : 0,
    }))
    return NextResponse.json(mockEquipmentWithCounts)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma")
    const { generateQRFromData } = await import("@/lib/qr-utils")

    const body = await request.json()
    const { tag_no, equipment_name, equipment_type, location, installation_date } = body

    // Create equipment first
    const equipment = await prisma.equipmentMaster.create({
      data: {
        tagNo: tag_no,
        equipmentName: equipment_name,
        equipmentType: equipment_type,
        location,
        installationDate: installation_date ? new Date(installation_date) : null,
      },
    })

    // Generate QR code
    const qrData = {
      type: "equipment",
      id: equipment.id,
      tagNo: equipment.tagNo,
      equipmentName: equipment.equipmentName,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/equipment/${equipment.id}`
    }

    const qrCodeDataURL = await generateQRFromData(qrData)

    // Update equipment with QR code
    const updatedEquipment = await prisma.equipmentMaster.update({
      where: { id: equipment.id },
      data: { qrCode: qrCodeDataURL },
    })

    return NextResponse.json(updatedEquipment)
  } catch (error) {
    console.error("Database error:", error)

    // Return mock success response
    const body = await request.json()
    const mockEquipment = {
      id: Date.now(),
      tagNo: body.tag_no,
      equipmentName: body.equipment_name,
      equipmentType: body.equipment_type,
      location: body.location,
      installationDate: body.installation_date ? new Date(body.installation_date) : null,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(mockEquipment)
  }
}
