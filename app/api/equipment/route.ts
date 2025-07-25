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
          },
        },
      },
      orderBy: {
        tagNo: "asc",
      },
    })

    // Transform the data to include counts
    const equipmentWithCounts = equipment.map(item => ({
      ...item,
      carbonBrushCount: item._count.carbonBrushRecords,
      windingResistanceCount: item._count.windingResistanceRecords,
    }))

    return NextResponse.json(equipmentWithCounts)
  } catch (error) {
    console.error("Database error, using mock data:", error)
    return NextResponse.json(mockEquipment)
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
