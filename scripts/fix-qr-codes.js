const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixBrokenQRCodes() {
  try {
    // Find equipment with broken QR codes (not base64 images)
    const equipmentWithBrokenQR = await prisma.equipmentMaster.findMany({
      where: {
        qrCode: {
          not: {
            startsWith: 'data:image/'
          }
        }
      }
    })

    console.log(`Found ${equipmentWithBrokenQR.length} equipment with broken QR codes`)

    // Clear the broken QR codes so they can be regenerated properly
    for (const equipment of equipmentWithBrokenQR) {
      await prisma.equipmentMaster.update({
        where: { id: equipment.id },
        data: { qrCode: null }
      })
      console.log(`Cleared broken QR code for equipment: ${equipment.tagNo}`)
    }

    console.log('Fixed all broken QR codes. Users can now regenerate them properly.')
  } catch (error) {
    console.error('Error fixing QR codes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixBrokenQRCodes()
