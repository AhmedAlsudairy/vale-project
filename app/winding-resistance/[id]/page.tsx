"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Calendar, Zap, Settings, BarChart3 } from "lucide-react"
import { generateQR } from "@/lib/qr-utils"
import { ErrorBoundary } from "@/components/error-boundary"
import Link from "next/link"

interface WindingResistanceRecord {
  id: number
  motorNo: string
  windingResistance: {
    ry: number
    yb: number
    rb: number
  }
  irValues: {
    ug_1min: number
    ug_10min: number
    vg_1min: number
    vg_10min: number
    wg_1min: number
    wg_10min: number
  }
  polarizationIndex: number | null
  darValues: {
    ug_30sec: number
    ug_1min: number
    vg_30sec: number
    vg_1min: number
    wg_30sec: number
    wg_1min: number
  } | null
  inspectionDate: string
  doneBy: string | null
  remarks: string | null
  createdAt: string
}

export default function WindingResistanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<WindingResistanceRecord | null>(null)
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
      const response = await fetch(`/api/winding-resistance/${recordId}`)

      if (response.ok) {
        const data = await response.json()
        setRecord(data)
        setError(null)
      } else if (response.status === 404) {
        setError("Winding resistance record not found")
      } else {
        throw new Error("Failed to fetch record")
      }
    } catch (error) {
      console.error("Error fetching record:", error)
      setError("Failed to load winding resistance record")
    } finally {
      setIsLoading(false)
    }
  }

  const generateRecordQR = async () => {
    if (!record) return
    try {
      const qrCode = await generateQR(record.id, "winding-resistance")
      const link = document.createElement("a")
      link.download = `winding-resistance-${record.id}-qr.png`
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

  const getIRStatus = (value: number) => {
    if (value >= 10)
      return { status: "Excellent", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    if (value >= 1)
      return {
        status: "Acceptable",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      }
    return { status: "Poor", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" }
  }

  const getPIStatus = (pi: number) => {
    if (pi >= 4.0)
      return { status: "Excellent", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    if (pi >= 2.0)
      return { status: "Good", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    if (pi >= 1.5)
      return {
        status: "Acceptable",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      }
    return { status: "Poor", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" }
  }

  const getDARStatus = (dar: number) => {
    if (dar >= 4.0)
      return { status: "Excellent", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    if (dar >= 1.6)
      return { status: "Good", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    if (dar >= 1.25)
      return {
        status: "Acceptable",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      }
    return { status: "Poor", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" }
  }

  const calculateDAR = (phase: "ug" | "vg" | "wg") => {
    if (!record?.darValues) return 0
    const oneMin = record.darValues[`${phase}_1min` as keyof typeof record.darValues]
    const thirtySec = record.darValues[`${phase}_30sec` as keyof typeof record.darValues]
    return thirtySec > 0 ? oneMin / thirtySec : 0
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm sm:text-base">Loading winding resistance record...</p>
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
            <Zap className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Record Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The winding resistance record you're looking for doesn't exist."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/winding-resistance">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Winding Tests
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const avgIR = (record.irValues.ug_1min + record.irValues.vg_1min + record.irValues.wg_1min) / 3
  const piStatus = getPIStatus(record.polarizationIndex || 0)
  const irStatus = getIRStatus(avgIR)

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/winding-resistance" className="hover:text-primary">
                Winding Tests
              </Link>
              <span>/</span>
              <span>Record #{record.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Winding Resistance Test</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Motor: {record.motorNo} • {formatDate(record.inspectionDate)}
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
          <Card className={`${irStatus.bgColor} ${irStatus.borderColor}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average IR</p>
                  <p className={`text-2xl font-bold ${irStatus.color}`}>{avgIR.toFixed(1)} GΩ</p>
                </div>
                <BarChart3 className={`h-8 w-8 ${irStatus.color}`} />
              </div>
              <p className={`text-xs mt-1 ${irStatus.color}`}>{irStatus.status}</p>
            </CardContent>
          </Card>

          <Card className={`${piStatus.bgColor} ${piStatus.borderColor}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Polarization Index</p>
                  <p className={`text-2xl font-bold ${piStatus.color}`}>
                    {record.polarizationIndex?.toFixed(2) || "N/A"}
                  </p>
                </div>
                <Zap className={`h-8 w-8 ${piStatus.color}`} />
              </div>
              <p className={`text-xs mt-1 ${piStatus.color}`}>{piStatus.status}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Test Date</p>
                  <p className="text-lg font-bold">{new Date(record.inspectionDate).toLocaleDateString()}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs mt-1 text-muted-foreground">
                {record.doneBy ? `By ${record.doneBy}` : "Technician not specified"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Test Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Test Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Motor No</p>
                  <p className="font-mono text-lg">{record.motorNo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Test Date</p>
                  <p>{new Date(record.inspectionDate).toLocaleDateString()}</p>
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

          {/* Winding Resistance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Winding Resistance
              </CardTitle>
              <CardDescription>Phase-to-phase resistance measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">R-Y</p>
                  <p className="text-xl font-bold">{record.windingResistance.ry.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Ω</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Y-B</p>
                  <p className="text-xl font-bold">{record.windingResistance.yb.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Ω</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">R-B</p>
                  <p className="text-xl font-bold">{record.windingResistance.rb.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Ω</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* IR Values */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Insulation Resistance (IR) Values
            </CardTitle>
            <CardDescription>500V DC test results for each phase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { phase: "U-G", min1: record.irValues.ug_1min, min10: record.irValues.ug_10min },
                { phase: "V-G", min1: record.irValues.vg_1min, min10: record.irValues.vg_10min },
                { phase: "W-G", min1: record.irValues.wg_1min, min10: record.irValues.wg_10min },
              ].map(({ phase, min1, min10 }) => {
                const status = getIRStatus(min1)
                return (
                  <div key={phase} className={`p-4 rounded-lg border ${status.bgColor} ${status.borderColor}`}>
                    <h4 className="font-semibold text-center mb-3">{phase} Phase</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">1 Minute:</span>
                        <span className={`font-bold ${status.color}`}>{min1.toFixed(2)} GΩ</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">10 Minutes:</span>
                        <span className={`font-bold ${status.color}`}>{min10.toFixed(2)} GΩ</span>
                      </div>
                      <div className="text-center">
                        <Badge variant={min1 >= 10 ? "default" : min1 >= 1 ? "secondary" : "destructive"}>
                          {status.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* DAR Values and Calculations */}
        {record.darValues && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DAR Values */}
            <Card>
              <CardHeader>
                <CardTitle>DAR Values</CardTitle>
                <CardDescription>Dielectric Absorption Ratio measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { phase: "U-G", sec30: record.darValues.ug_30sec, min1: record.darValues.ug_1min },
                    { phase: "V-G", sec30: record.darValues.vg_30sec, min1: record.darValues.vg_1min },
                    { phase: "W-G", sec30: record.darValues.wg_30sec, min1: record.darValues.wg_1min },
                  ].map(({ phase, sec30, min1 }) => {
                    const darValue = sec30 > 0 ? min1 / sec30 : 0
                    const darStatus = getDARStatus(darValue)
                    return (
                      <div key={phase} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{phase} Phase</p>
                          <p className="text-xs text-muted-foreground">
                            30s: {sec30.toFixed(2)} GΩ • 1m: {min1.toFixed(2)} GΩ
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${darStatus.color}`}>{darValue > 0 ? darValue.toFixed(2) : "N/A"}</p>
                          <p className={`text-xs ${darStatus.color}`}>{darStatus.status}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Calculated Results */}
            <Card>
              <CardHeader>
                <CardTitle>Calculated Results</CardTitle>
                <CardDescription>Derived test parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg border ${piStatus.bgColor} ${piStatus.borderColor}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Polarization Index (PI)</span>
                    <span className={`text-xl font-bold ${piStatus.color}`}>
                      {record.polarizationIndex?.toFixed(2) || "N/A"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">PI = IR(10min) / IR(1min)</p>
                  <Badge
                    variant={
                      record.polarizationIndex && record.polarizationIndex >= 2.0
                        ? "default"
                        : record.polarizationIndex && record.polarizationIndex >= 1.5
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {piStatus.status}
                  </Badge>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">Average Values</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Average IR (1min):</span>
                      <span className="font-mono">{avgIR.toFixed(2)} GΩ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Winding Resistance:</span>
                      <span className="font-mono">
                        {(
                          (record.windingResistance.ry + record.windingResistance.yb + record.windingResistance.rb) /
                          3
                        ).toFixed(2)}{" "}
                        Ω
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/winding-resistance">
                <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tests
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
