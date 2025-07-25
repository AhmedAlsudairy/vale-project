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
  const [debugInfo, setDebugInfo] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startScanning = async () => {
    try {
      setError(null)
      setDebugInfo("Initializing scanner...")
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera access not supported on this device/browser.")
        return
      }

      // Wait for video element to be available
      let attempts = 0
      while (!videoRef.current && attempts < 20) {
        setDebugInfo(`Waiting for video element... (${attempts + 1}/20)`)
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (!videoRef.current) {
        setDebugInfo("Video element never became available")
        setError("Video element not ready. Please try again.")
        return
      }

      setDebugInfo("Video element ready, requesting camera access...")

      // Request camera access with progressive fallback
      let stream: MediaStream | null = null
      
      try {
        setDebugInfo("Trying back camera...")
        // Try with back camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1280, min: 320 },
            height: { ideal: 720, min: 240 },
          },
        })
      } catch (err) {
        try {
          setDebugInfo("Trying any camera...")
          // Fallback to any available camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280, min: 320 },
              height: { ideal: 720, min: 240 },
            },
          })
        } catch (err2) {
          setDebugInfo("Trying basic camera...")
          // Final fallback - basic video request
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          })
        }
      }

      if (!videoRef.current) {
        setDebugInfo("Video ref is null")
        setError("Video element not available")
        return
      }

      if (!stream) {
        setDebugInfo("Stream is null")
        setError("Failed to get camera stream")
        return
      }

      setDebugInfo("Stream obtained, setting up video...")
      const video = videoRef.current
      video.srcObject = stream
      
      // Force video attributes for mobile compatibility
      video.setAttribute('playsinline', 'true')
      video.setAttribute('webkit-playsinline', 'true')
      video.muted = true
      video.autoplay = true
      
      // Wait for video to load and play
      const playPromise = new Promise<void>((resolve, reject) => {
        const onLoadedMetadata = () => {
          setDebugInfo(`Video metadata loaded: ${video.videoWidth}x${video.videoHeight}`)
          
          // Try to play the video
          const playAttempt = video.play()
          if (playAttempt && typeof playAttempt.then === 'function') {
            playAttempt.then(() => {
              setDebugInfo("Video playing successfully")
              setIsScanning(true)
              resolve()
            }).catch((playError) => {
              setDebugInfo(`Play error: ${playError.message}`)
              // Sometimes play fails but video still works, so let's continue
              setIsScanning(true)
              resolve()
            })
          } else {
            setDebugInfo("Video play called synchronously")
            setIsScanning(true)
            resolve()
          }
        }

        const onError = (e: Event) => {
          setDebugInfo(`Video error: ${(e as any).message || 'Unknown video error'}`)
          reject(new Error("Video error"))
        }

        const onCanPlay = () => {
          setDebugInfo("Video can play event fired")
        }

        video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
        video.addEventListener('error', onError, { once: true })
        video.addEventListener('canplay', onCanPlay, { once: true })

        // Force load if not already loading
        if (video.readyState < 1) {
          video.load()
        }

        // Timeout fallback
        setTimeout(() => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          video.removeEventListener('canplay', onCanPlay)
          
          if (video.readyState >= 2) {
            setDebugInfo("Video ready via timeout fallback")
            setIsScanning(true)
            resolve()
          } else {
            setDebugInfo("Video loading timeout - no metadata")
            reject(new Error("Video loading timeout"))
          }
        }, 8000)
      })

      await playPromise
    } catch (err) {
      console.error("Error accessing camera:", err)
      setDebugInfo(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access in your browser settings.")
        } else if (err.name === "NotFoundError") {
          setError("No camera found. Please ensure a camera is connected and enabled.")
        } else if (err.name === "NotReadableError") {
          setError("Camera is already in use by another application. Please close other apps using the camera.")
        } else if (err.name === "OverconstrainedError") {
          setError("Camera constraints not supported. Trying basic camera access...")
          // Try one more time with minimal constraints
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({ video: true })
            if (videoRef.current) {
              videoRef.current.srcObject = basicStream
              setIsScanning(true)
            }
          } catch (basicErr) {
            setError("Could not access camera with any settings.")
          }
        } else {
          setError(`Camera error: ${err.message}`)
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
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    setDebugInfo("")
  }

  const handleClose = () => {
    stopScanning()
    setIsOpen(false)
    setError(null)
    setDebugInfo("")
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

          {debugInfo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">Debug: {debugInfo}</p>
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
                webkit-playsinline="true"
                muted
                controls={false}
                preload="auto"
                className="w-full rounded-lg bg-black"
                style={{ 
                  aspectRatio: "4/3",
                  objectFit: "cover",
                  maxHeight: "400px",
                  minHeight: "200px"
                }}
                onCanPlay={() => {
                  console.log("Video can play")
                  if (videoRef.current) {
                    setDebugInfo(`Video ready: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`)
                  }
                }}
                onPlaying={() => {
                  setDebugInfo("Video is now playing")
                }}
                onLoadStart={() => {
                  setDebugInfo("Video load started")
                }}
                onLoadedData={() => {
                  setDebugInfo("Video data loaded")
                }}
                onLoadedMetadata={() => {
                  setDebugInfo("Video metadata loaded")
                }}
                onError={(e) => {
                  console.error("Video error:", e)
                  setError("Video playback error. Please try again.")
                  setDebugInfo("Video element error occurred")
                }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Loading indicator while video loads */}
              {(!videoRef.current?.videoWidth || videoRef.current?.readyState < 2) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg text-white text-center p-4">
                  <div className="text-sm mb-2">
                    {videoRef.current?.videoWidth ? "Camera Active" : "Loading camera..."}
                  </div>
                  {debugInfo && (
                    <div className="text-xs opacity-75">{debugInfo}</div>
                  )}
                  <div className="mt-2 w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
