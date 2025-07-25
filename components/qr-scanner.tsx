"use client"

import { useState } from "react"
import { Scanner, useDevices, outline, boundingBox, centerText } from "@yudiel/react-qr-scanner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, Camera, X, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QRScannerProps {
  onScan: (data: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined)
  const [tracker, setTracker] = useState<string>("centerText")
  const [pause, setPause] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const devices = useDevices()

  function getTracker() {
    switch (tracker) {
      case "outline":
        return outline
      case "boundingBox":
        return boundingBox
      case "centerText":
        return centerText
      default:
        return undefined
    }
  }

  const handleScan = async (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const data = detectedCodes[0].rawValue
      setPause(true)
      
      try {
        onScan(data)
        handleClose()
      } catch (error) {
        console.error("Error processing QR code:", error)
        setError("Error processing QR code")
        setPause(false)
      }
    }
  }

  const handleError = (error: any) => {
    console.error("QR Scanner error:", error)
    setError(`Scanner error: ${error?.message || 'Unknown error'}`)
  }

  const handleClose = () => {
    setPause(false)
    setIsOpen(false)
    setError(null)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // You can implement file-based QR reading here if needed
    // For now, we'll focus on camera scanning
    setError("Please use the camera scanner for QR code detection.")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-sm bg-transparent">
          <QrCode className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Scan QR</span>
          <span className="sm:hidden">QR</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh]">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl">Scan QR Code</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Camera and Settings Controls */}
          <div className="space-y-2">
            {devices && devices.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Camera Device</Label>
                <Select value={deviceId} onValueChange={setDeviceId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device, index) => (
                      <SelectItem key={index} value={device.deviceId}>
                        {device.label || `Camera ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-sm text-muted-foreground">Scanner Overlay</Label>
              <Select value={tracker} onValueChange={setTracker}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="centerText">Center Text</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="boundingBox">Bounding Box</SelectItem>
                  <SelectItem value="none">No Tracker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* QR Scanner */}
          <div className="relative">
            <Scanner
              formats={[
                "qr_code",
                "micro_qr_code",
                "rm_qr_code",
                "maxi_code",
                "pdf417",
                "aztec",
                "data_matrix",
                "matrix_codes",
                "codabar",
                "code_39",
                "code_93",
                "code_128",
                "ean_8",
                "ean_13",
                "itf",
                "linear_codes",
                "upc_a",
                "upc_e",
              ]}
              constraints={{
                deviceId: deviceId,
              }}
              onScan={handleScan}
              onError={handleError}
              styles={{ 
                container: { 
                  height: "300px", 
                  width: "100%",
                  borderRadius: "8px",
                  overflow: "hidden"
                } 
              }}
              components={{
                onOff: true,
                torch: true,
                zoom: false,
                finder: true,
                tracker: getTracker(),
              }}
              allowMultiple={false}
              scanDelay={1000}
              paused={pause}
            />
          </div>

          {/* File Upload Alternative */}
          <div className="border-t pt-4">
            <Label htmlFor="qr-upload" className="text-sm text-muted-foreground">
              Or upload a QR code image
            </Label>
            <Input 
              id="qr-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="mt-2" 
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            {pause && (
              <Button onClick={() => setPause(false)} className="flex-1">
                Resume Scanning
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
