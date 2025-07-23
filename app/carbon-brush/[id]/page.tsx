"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Calendar, Settings, BarChart3, Clipboard } from "lucide-react"
import { generateQR } from "@/lib/qr-utils"
import { ErrorBoundary } from "@/components/error-boundary"
import Link from "next/link"

interface CarbonBrushRecord {
  id: number
  tagNo: string
  equipmentName: string
  brushType: string
  inspectionDate: string
  workOrderNo: string | null
  doneBy: string | null
  measurements: {
    [key: string]: number
  }
  slipRingThickness: number
  slipRingIr: number
  remarks: string | null
  createdAt: string
  equipment?: {
    equipmentName: string
  } | null
}

export default function CarbonBrushDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<CarbonBrushRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recordId = params.id as string

  useEffect(() => {
    if (recordId) {
      fetchRecord()
    }
  }, [recordId])

  const fetchRecord = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/carbon-brush/${recordId}`)

      if (response.ok) {
        const data = await response.json()
        setRecord(data)
        setError(null)
      } else if (response.status === 404) {
        setError("Carbon brush record not found")
      } else {
        throw new Error("Failed to fetch record")
      }
    } catch (error) {
      console.error("Error fetching record:", error)
      setError("Failed to load carbon brush record")
    } finally {
      setIsLoading(false)
    }
  }

  const generateRecordQR = async () => {
    if (!record) return
    try {
      const qrCode = await generateQR(record.id, "carbon-brush")
      const link = document.createElement("a")
      link.download = `carbon-brush-${record.id}-qr.png`
      link.href = qrCode
      link.click()
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  const getBrushStatus = (measurement: number) => {
    if (measurement >= 32)
      return { status: "Good", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    if (measurement >= 25)
      return {
        status: "Warning",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      }
    return { status: "Critical", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" }
  }

  const getIRStatus = (value: number) => {
    if (value >= 2.0)
      return { status: "Good", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    return { status: "Poor", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm sm:text-base">Loading carbon brush record...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Clipboard className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Record Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The carbon brush record you're looking for doesn't exist."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/carbon-brush">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Inspections
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const minMeasurement = Math.min(...Object.values(record.measurements))
  const maxMeasurement = Math.max(...Object.values(record.measurements))
  const avgMeasurement =
    Object.values(record.measurements).reduce((a, b) => a + b, 0) / Object.values(record.measurements).length
  const brushStatus = getBrushStatus(minMeasurement)
  const irStatus = getIRStatus(record.slipRingIr)

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/carbon-brush" className="hover:text-primary">
                Carbon Brush Inspections
              </Link>
              <span>/</span>
              <span>Record #{record.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Carbon Brush Inspection</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {record.tagNo} • {formatDate(record.inspectionDate)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={generateRecordQR}>
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className={`${brushStatus.bgColor} ${brushStatus.borderColor}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Min Measurement</p>
                  <p className={`text-2xl font-bold ${brushStatus.color}`}>{minMeasurement.toFixed(1)} mm</p>
                </div>
                <BarChart3 className={`h-8 w-8 ${brushStatus.color}`} />
              </div>
              <p className={`text-xs mt-1 ${brushStatus.color}`}>{brushStatus.status}</p>
            </CardContent>
          </Card>

          <Card className={`${irStatus.bgColor} ${irStatus.borderColor}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slip Ring IR</p>
                  <p className={`text-2xl font-bold ${irStatus.color}`}>{record.slipRingIr.toFixed(2)} GΩ</p>
                </div>
                <Settings className={`h-8 w-8 ${irStatus.color}`} />
              </div>
              <p className={`text-xs mt-1 ${irStatus.color}`}>{irStatus.status}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inspection Date</p>
                  <p className="text-lg font-bold">{new Date(record.inspectionDate).toLocaleDateString()}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs mt-1 text-muted-foreground">
                {record.doneBy ? `By ${record.doneBy}` : "Inspector not specified"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inspection Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="w-5 h-5" />
                Inspection Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">TAG NO</p>
                  <p className="font-mono text-lg">{record.tagNo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Equipment</p>
                  <p className="text-sm">{record.equipmentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Brush Type</p>
                  <p>{record.brushType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Work Order</p>
                  <p className="font-mono">{record.workOrderNo || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Done By</p>
                  <p>{record.doneBy || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Record ID</p>
                  <p className="font-mono">#{record.id}</p>
                </div>
              </div>

              {record.remarks && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Remarks</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">{record.remarks}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Slip Ring Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Slip Ring Data
              </CardTitle>
              <CardDescription>Slip ring thickness and insulation resistance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Thickness</p>
                  <p className="text-2xl font-bold">{record.slipRingThickness.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">mm</p>
                </div>
                <div className={`text-center p-4 rounded-lg ${irStatus.bgColor} ${irStatus.borderColor} border`}>
                  <p className="text-sm font-medium text-muted-foreground">IR (1 min)</p>
                  <p className={`text-2xl font-bold ${irStatus.color}`}>{record.slipRingIr.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">GΩ</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-1">Reference Values:</p>
                <p className="text-xs text-blue-700">• Thickness: 12-15mm typical</p>
                <p className="text-xs text-blue-700">• IR: ≥2.0 GΩ minimum</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carbon Brush Measurements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Carbon Brush Measurements
            </CardTitle>
            <CardDescription>Individual brush measurements in millimeters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              {Object.entries(record.measurements).map(([brush, measurement]) => {
                const status = getBrushStatus(measurement)
                return (
                  <div key={brush} className={`p-4 rounded-lg border ${status.bgColor} ${status.borderColor}`}>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Brush {brush}</p>
                      <p className={`text-xl font-bold ${status.color}`}>{measurement.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">mm</p>
                      <Badge
                        variant={measurement >= 32 ? "default" : measurement >= 25 ? "secondary" : "destructive"}
                        className="mt-2 text-xs"
                      >
                        {status.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm font-medium text-muted-foreground">Minimum</p>
                <p className={`text-lg font-bold ${getBrushStatus(minMeasurement).color}`}>
                  {minMeasurement.toFixed(1)} mm
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm font-medium text-muted-foreground">Average</p>
                <p className="text-lg font-bold">{avgMeasurement.toFixed(1)} mm</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm font-medium text-muted-foreground">Maximum</p>
                <p className="text-lg font-bold">{maxMeasurement.toFixed(1)} mm</p>
              </div>
            </div>

            {/* Reference Guide */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Measurement Reference Guide</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-blue-700">Good: ≥32mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-blue-700">Warning: 25-32mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-blue-700">Critical: {"<"}25mm</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/carbon-brush">
                <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Inspections
                </Button>
              </Link>
              <Button onClick={generateRecordQR} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}
