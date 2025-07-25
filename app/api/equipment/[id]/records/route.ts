import { NextResponse, type NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { prisma } = await import("@/lib/prisma")
    const equipmentId = parseInt(params.id)

    const equipment = await prisma.equipmentMaster.findUnique({
      where: {
        id: equipmentId,
      },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    // Fetch carbon brush records
    const carbonBrushRecords = await prisma.carbonBrushRecord.findMany({
      where: {
        tagNo: equipment.tagNo,
      },
      orderBy: {
        inspectionDate: "desc",
      },
    })

    // Fetch winding resistance records  
    const windingResistanceRecords = await prisma.windingResistanceRecord.findMany({
      where: {
        motorNo: equipment.tagNo,
      },
      orderBy: {
        inspectionDate: "desc",
      },
    })

    return NextResponse.json({
      carbonBrushRecords,
      windingResistanceRecords,
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
