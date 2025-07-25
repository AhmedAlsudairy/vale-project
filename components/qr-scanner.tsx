"use client"

import { useState, useRef, useEffect } from "react"
import jsQR from "jsqr"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, Camera, X, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface QRScannerProps {
  onScan: (data: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startScanning = async () => {
    try {
      setError(null)
      
      // Request camera access with fallback constraints
      let stream: MediaStream | null = null
      
      try {
        // Try with back camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
        })
      } catch (err) {
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
        })
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream
        
        // Wait for video metadata to load
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsScanning(true)
            }).catch((playError) => {
              console.error("Error playing video:", playError)
              setError("Could not start video playback. Please try again.")
            })
          }
        }

        // Handle video errors
        videoRef.current.onerror = () => {
          setError("Video stream error. Please try again.")
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access in your browser settings.")
        } else if (err.name === "NotFoundError") {
          setError("No camera found. Please ensure a camera is connected and enabled.")
        } else if (err.name === "NotReadableError") {
          setError("Camera is already in use by another application. Please close other apps using the camera.")
        } else {
          setError("Could not access camera. Please check permissions and ensure it's not in use by another app.")
        }
      } else {
        setError("An unknown error occurred while accessing the camera.")
      }
    }
  }

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
    setIsScanning(false)
  }

  const handleClose = () => {
    stopScanning()
    setIsOpen(false)
  }

  const scanQRCode = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      if (context) {
        canvas.height = video.videoHeight
        canvas.width = video.videoWidth
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        if (code) {
          onScan(code.data)
          handleClose()
        }
      }
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const context = canvas.getContext("2d")
        if (context) {
          context.drawImage(img, 0, 0, img.width, img.height)
          const imageData = context.getImageData(0, 0, img.width, img.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code) {
            onScan(code.data)
            handleClose()
          } else {
            setError("No QR code found in the uploaded image.")
          }
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (isScanning) {
      scanIntervalRef.current = setInterval(scanQRCode, 500)
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [isScanning])

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

          {!isScanning ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Position the QR code within the camera frame to scan, or upload an image.
                </p>
                <Button onClick={startScanning} className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
                <div className="my-4">
                  <Label htmlFor="qr-upload" className="text-sm text-muted-foreground">
                    Or upload a QR code image
                  </Label>
                  <Input id="qr-upload" type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-black"
                style={{ 
                  aspectRatio: "4/3",
                  objectFit: "cover",
                  maxHeight: "400px"
                }}
                onCanPlay={() => {
                  console.log("Video can play")
                  if (videoRef.current) {
                    console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight)
                  }
                }}
                onError={(e) => {
                  console.error("Video error:", e)
                  setError("Video playback error. Please try again.")
                }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Loading indicator while video loads */}
              {!videoRef.current?.videoWidth && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-white text-sm">Loading camera...</div>
                </div>
              )}

              {/* Scanning Overlay */}
              <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary"></div>

                {/* Center guide */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary/50 rounded-lg"></div>
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded text-sm">
                Position QR code in the center
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            {isScanning && (
              <>
                <Button onClick={scanQRCode} variant="secondary" className="flex-1">
                  Scan Now
                </Button>
                <Button onClick={stopScanning} className="flex-1">
                  Stop Camera
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
