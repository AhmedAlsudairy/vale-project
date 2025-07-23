import QRCode from "qrcode"

export async function generateQR(recordId: number, type: "carbon-brush" | "winding-resistance"): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/${type}/${recordId}`
  const qrCode = await QRCode.toDataURL(url, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  })
  return qrCode
}

export function parseQRData(qrText: string) {
  try {
    // If it's a URL, extract the record ID and type
    const url = new URL(qrText)
    const pathParts = url.pathname.split("/")
    if (pathParts.length >= 3) {
      const type = pathParts[1]
      const id = pathParts[2]
      return { type, id: Number.parseInt(id) }
    }
  } catch {
    // If not a URL, try to parse as JSON
    try {
      return JSON.parse(qrText)
    } catch {
      return null
    }
  }
  return null
}
