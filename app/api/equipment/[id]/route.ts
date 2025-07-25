import { NextResponse, type NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import("@/lib/prisma")
    const { id } = await params
    const equipmentId = parseInt(id)

    const equipment = await prisma.equipmentMaster.findUnique({
      where: {
        id: equipmentId,
      },
      include: {
        carbonBrushRecords: {
          orderBy: {
            inspectionDate: "desc",
          },
          take: 5,
        },
        windingResistanceRecords: {
          orderBy: {
            inspectionDate: "desc",
          },
          take: 5,
        },
      },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...equipment,
      carbonBrushCount: equipment.carbonBrushRecords.length,
      windingResistanceCount: equipment.windingResistanceRecords.length,
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import("@/lib/prisma")
    const { id } = await params
    const equipmentId = parseInt(id)
    const body = await request.json()
    const { tag_no, equipment_name, equipment_type, location, installation_date } = body

    const equipment = await prisma.equipmentMaster.update({
      where: {
        id: equipmentId,
      },
      data: {
        tagNo: tag_no,
        equipmentName: equipment_name,
        equipmentType: equipment_type,
        location,
        installationDate: installation_date ? new Date(installation_date) : null,
      },
    })

    return NextResponse.json(equipment)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import("@/lib/prisma")
    const { id } = await params
    const equipmentId = parseInt(id)

    await prisma.equipmentMaster.delete({
      where: {
        id: equipmentId,
      },
    })

    return NextResponse.json({ message: "Equipment deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
