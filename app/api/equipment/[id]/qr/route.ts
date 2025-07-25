import { NextResponse, type NextRequest } from "next/server"
import { generateQRFromData } from "@/lib/qr-utils"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { prisma } = await import("@/lib/prisma")
    const equipmentId = parseInt(params.id)

    // Get equipment details
    const equipment = await prisma.equipmentMaster.findUnique({
      where: {
        id: equipmentId,
      },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    // Generate QR code containing equipment data
    const qrData = {
      type: "equipment",
      id: equipmentId,
      tagNo: equipment.tagNo,
      equipmentName: equipment.equipmentName,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/equipment/${equipmentId}`
    }

    const qrCodeDataURL = await generateQRFromData(qrData)

    // Update equipment with QR code - first run migration
    try {
      const updatedEquipment = await prisma.equipmentMaster.update({
        where: {
          id: equipmentId,
        },
        data: {
          qrCode: qrCodeDataURL,
        },
      })
      return NextResponse.json(updatedEquipment)
    } catch (dbError: any) {
      if (dbError.code === 'P2025' || dbError.message.includes('qrCode')) {
        // QR code field doesn't exist yet, return the data anyway
        return NextResponse.json({
          ...equipment,
          qrCode: qrCodeDataURL,
        })
      }
      throw dbError
    }
  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
