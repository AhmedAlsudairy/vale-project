"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { QRScanner } from "@/components/qr-scanner"
import { generateQR } from "@/lib/qr-utils"
import { forecastBrushLife } from "@/lib/forecast"
import { Download, Plus, TrendingUp, AlertTriangle, Calendar, User, FileText, Settings, Info, X } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ErrorBoundary, withErrorBoundary } from "@/components/error-boundary"

interface CarbonBrushRecord {
  id: number
  tagNo: string
  equipmentName: string
  brushType: string
  inspectionDate: string
  workOrderNo: string | null
  doneBy: string | null
  measurements: { [key: string]: number }
  slipRingThickness: number
  slipRingIr: number
  remarks: string | null
  createdAt: string
  equipment?: {
    equipmentName: string
  } | null
}

interface Equipment {
  id: number
  tagNo: string
  equipmentName: string
  equipmentType: string
  location: string | null
}

function CarbonBrushPage() {
  const [records, setRecords] = useState<CarbonBrushRecord[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [selectedTagNo, setSelectedTagNo] = useState("")
  const [previousRecords, setPreviousRecords] = useState<CarbonBrushRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [brushTypes, setBrushTypes] = useState([
    { value: "C80X", label: "C80X" },
    { value: "C60X", label: "C60X" },
    { value: "C100X", label: "C100X" },
  ])

  const [formData, setFormData] = useState({
    tag_no: "",
    equipment_name: "",
    brush_type: "C80X",
    inspection_date: new Date().toISOString().split("T")[0],
    work_order_no: "",
    done_by: "",
    measurements: {
      "1A": 0,
      "1B": 0,
      "2A": 0,
      "2B": 0,
      "3A": 0,
      "3B": 0,
      "4A": 0,
      "4B": 0,
      "5A": 0,
      "5B": 0,
    },
    slip_ring_thickness: 0,
    slip_ring_ir: 0,
    remarks: "",
  })

  // Reference values for guidance
  const referenceValues = {
    brushMeasurement: {
      healthy: "H25",
      borderline: "B32",
      limit: "L50",
      unit: "mm",
    },
    slipRingThickness: {
      typical: "12-15",
      unit: "mm",
    },
    slipRingIR: {
      minimum: "≥2.0",
      unit: "GΩ (1 minute)",
    },
  }

  useEffect(() => {
    fetchRecords()
    fetchEquipment()
  }, [])

  useEffect(() => {
    if (selectedTagNo) {
      fetchPreviousRecords(selectedTagNo)
    }
  }, [selectedTagNo])

  const fetchRecords = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/carbon-brush")
      const data = await response.json()

      if (response.status === 503 && data.fallback) {
        setRecords([])
        setError("Database temporarily unavailable. Some features may be limited.")
      } else if (response.ok) {
        setRecords(data)
        setError(null)
      } else {
        throw new Error(data.error || "Failed to fetch records")
      }
    } catch (error) {
      console.error("Error fetching records:", error)
      setError("Failed to load inspection records")
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await fetch("/api/equipment")
      const data = await response.json()

      if (response.status === 503 && data.fallback) {
        setEquipment(data.equipment || [])
      } else if (response.ok) {
        setEquipment(data)
      } else {
        throw new Error(data.error || "Failed to fetch equipment")
      }
    } catch (error) {
      console.error("Error fetching equipment:", error)
      // Fallback equipment data
      setEquipment([
        {
          id: 1,
          tagNo: "BO.3161.04.M1",
          equipmentName: "Induration Fan Motor",
          equipmentType: "Motor",
          location: "Induration Area",
        },
        {
          id: 2,
          tagNo: "BO.3161.05.M1",
          equipmentName: "Cooling Fan Motor",
          equipmentType: "Motor",
          location: "Cooling Area",
        },
        {
          id: 3,
          tagNo: "BO.3161.06.M1",
          equipmentName: "Exhaust Fan Motor",
          equipmentType: "Motor",
          location: "Exhaust Area",
        },
      ])
    }
  }

  const fetchPreviousRecords = async (tagNo: string) => {
    try {
      const response = await fetch(`/api/carbon-brush?tag_no=${tagNo}&limit=3`)
      const data = await response.json()

      if (response.ok) {
        setPreviousRecords(data)
      }
    } catch (error) {
      console.error("Error fetching previous records:", error)
      setPreviousRecords([])
    }
  }

  const handleTagNoChange = (tagNo: string) => {
    setSelectedTagNo(tagNo)
    setFormData((prev) => ({ ...prev, tag_no: tagNo }))

    const selectedEquipment = equipment.find((eq) => eq.tagNo === tagNo)
    if (selectedEquipment) {
      setFormData((prev) => ({ ...prev, equipment_name: selectedEquipment.equipmentName }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/carbon-brush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newRecord = await response.json()
        setRecords((prev) => [newRecord, ...prev])
        setFormData({
          tag_no: "",
          equipment_name: "",
          brush_type: "C80X",
          inspection_date: new Date().toISOString().split("T")[0],
          work_order_no: "",
          done_by: "",
          measurements: {
            "1A": 0,
            "1B": 0,
            "2A": 0,
            "2B": 0,
            "3A": 0,
            "3B": 0,
            "4A": 0,
            "4B": 0,
            "5A": 0,
            "5B": 0,
          },
          slip_ring_thickness: 0,
          slip_ring_ir: 0,
          remarks: "",
        })
        setShowForm(false)
        setSelectedTagNo("")
        setPreviousRecords([])
        setError(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save record")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("Failed to save inspection record")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQRScan = (data: string) => {
    console.log("QR Scanned:", data)
    
    try {
      // Try to parse as JSON first (equipment QR code)
      const parsed = JSON.parse(data)
      if (parsed.type === "equipment" && parsed.tagNo) {
        setSelectedTagNo(parsed.tagNo)
        setFormData(prev => ({
          ...prev,
          tag_no: parsed.tagNo,
          equipment_name: parsed.equipmentName || ""
        }))
        return
      }
    } catch {
      // Not JSON, try other formats
    }

    try {
      // Try to parse as URL
      const url = new URL(data)
      const pathParts = url.pathname.split("/")
      
      if (pathParts.includes("equipment")) {
        const tagIndex = pathParts.indexOf("equipment") + 1
        if (pathParts[tagIndex]) {
          // Find equipment by ID or tag
          const foundEquipment = equipment.find(e => 
            e.id.toString() === pathParts[tagIndex] || e.tagNo === pathParts[tagIndex]
          )
          if (foundEquipment) {
            setSelectedTagNo(foundEquipment.tagNo)
            setFormData(prev => ({
              ...prev,
              tag_no: foundEquipment.tagNo,
              equipment_name: foundEquipment.equipmentName
            }))
          }
        }
      }
    } catch {
      // Try direct tag number match
      const foundEquipment = equipment.find(e => e.tagNo === data)
      if (foundEquipment) {
        setSelectedTagNo(foundEquipment.tagNo)
        setFormData(prev => ({
          ...prev,
          tag_no: foundEquipment.tagNo,
          equipment_name: foundEquipment.equipmentName
        }))
      }
    }
  }

  const generateRecordQR = async (recordId: number) => {
    try {
      const qrCode = await generateQR(recordId, "carbon-brush")
      const link = document.createElement("a")
      link.download = `carbon-brush-${recordId}-qr.png`
      link.href = qrCode
      link.click()
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const getForecast = (tagNo: string) => {
    const tagRecords = records.filter((r) => r.tagNo === tagNo)
    if (tagRecords.length < 2) return null

    const historicalData = tagRecords.map((record) => ({
      date: new Date(record.inspectionDate),
      measurement: Math.min(...Object.values(record.measurements)),
    }))

    return forecastBrushLife(historicalData)
  }
//this is date formatter function
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm sm:text-base">Loading carbon brush data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Section - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Carbon Brush Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Track and manage carbon brush inspections</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <QRScanner onScan={handleQRScan} />
            <Button
              onClick={() => setShowForm(!showForm)}
              className="w-full sm:w-auto"
              variant={showForm ? "secondary" : "default"}
            >
              {showForm ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Close Form
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  New Inspection
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Alert - Improved UX */}
        {error && (
          <Card className={`border-yellow-200 bg-yellow-50 ${showForm ? "mb-2" : ""}`}>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 text-yellow-800 flex-1">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm sm:text-base font-medium">System Notice</p>
                    <p className="text-xs sm:text-sm mt-1">{error}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reference Values Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
              <Info className="h-4 w-4" />
              Measurement Reference Values
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-blue-800">Carbon Brush Measurements</p>
                <p className="text-blue-700">
                  Healthy:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">
                    ≥{referenceValues.brushMeasurement.healthy.slice(1)}mm
                  </span>
                </p>
                <p className="text-blue-700">
                  Borderline:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">
                    {referenceValues.brushMeasurement.borderline.slice(1)}mm
                  </span>
                </p>
                <p className="text-blue-700">
                  Limit:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">
                    {referenceValues.brushMeasurement.limit.slice(1)}mm
                  </span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-800">Slip Ring Thickness</p>
                <p className="text-blue-700">
                  Typical:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">
                    {referenceValues.slipRingThickness.typical}mm
                  </span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-800">Slip Ring IR</p>
                <p className="text-blue-700">
                  Minimum:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">{referenceValues.slipRingIR.minimum}</span>
                </p>
                <p className="text-xs text-blue-600">Measured at 1 minute</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Section - Fully Responsive */}
        {showForm && (
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Carbon Brush Inspection Form</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Record new carbon brush measurements and inspection data
                  </CardDescription>
                </div>
                {error && (
                  <Badge variant="secondary" className="text-xs">
                    Demo Mode
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Basic Information - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tag_no" className="text-sm font-medium">
                      TAG NO
                    </Label>
                    <Combobox
                      options={equipment.map((eq) => ({
                        value: eq.tagNo,
                        label: `${eq.tagNo} - ${eq.equipmentName}`,
                      }))}
                      value={formData.tag_no}
                      onValueChange={handleTagNoChange}
                      placeholder="Select or add TAG NO (e.g., BO.3161.04.M1)"
                      searchPlaceholder="Search TAG NO..."
                      allowCustom={true}
                      onAddNew={(newTagNo) => {
                        const newEquipment = {
                          id: Date.now(),
                          tagNo: newTagNo,
                          equipmentName: `New Equipment - ${newTagNo}`,
                          equipmentType: "Motor",
                          location: null,
                        }
                        setEquipment((prev) => [...prev, newEquipment])
                      }}
                    />
                    {previousRecords.length > 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                        <p className="font-medium mb-1">Previous inspections:</p>
                        {previousRecords.slice(0, 2).map((record) => (
                          <p key={record.id} className="truncate">
                            {formatDate(record.inspectionDate)} - Min: {Math.min(...Object.values(record.measurements))}
                            mm
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="equipment_name" className="text-sm font-medium">
                      Equipment Name
                    </Label>
                    <Input
                      id="equipment_name"
                      value={formData.equipment_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, equipment_name: e.target.value }))}
                      placeholder="e.g., Induration Fan Motor"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brush_type" className="text-sm font-medium">
                      Brush Type
                    </Label>
                    <Combobox
                      options={brushTypes}
                      value={formData.brush_type}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, brush_type: value }))}
                      placeholder="Select or add brush type (e.g., C80X)"
                      searchPlaceholder="Search brush type..."
                      allowCustom={true}
                      onAddNew={(newBrushType) => {
                        const newType = { value: newBrushType, label: newBrushType }
                        setBrushTypes((prev) => [...prev, newType])
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inspection_date" className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Inspection Date
                    </Label>
                    <Input
                      id="inspection_date"
                      type="date"
                      value={formData.inspection_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, inspection_date: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="work_order_no" className="text-sm font-medium flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Work Order No
                    </Label>
                    <Input
                      id="work_order_no"
                      value={formData.work_order_no}
                      onChange={(e) => setFormData((prev) => ({ ...prev, work_order_no: e.target.value }))}
                      placeholder="e.g., WO-2024-001"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="done_by" className="text-sm font-medium flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Done By
                    </Label>
                    <Input
                      id="done_by"
                      value={formData.done_by}
                      onChange={(e) => setFormData((prev) => ({ ...prev, done_by: e.target.value }))}
                      placeholder="Inspector Name"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Brush Measurements - Responsive Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Carbon Brush Measurements
                    </h3>
                    <div className="text-xs text-muted-foreground">Reference: H≥25mm, B=32mm, L=50mm</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3 sm:gap-4">
                    {Object.entries(formData.measurements).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-xs sm:text-sm font-medium">
                          Brush {key}
                        </Label>
                        <Input
                          id={key}
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              measurements: { ...prev.measurements, [key]: Number.parseFloat(e.target.value) || 0 },
                            }))
                          }
                          placeholder="mm"
                          className={cn(
                            "w-full text-sm",
                            value > 0 && value < 25 && "border-red-300 bg-red-50",
                            value >= 25 && value < 32 && "border-yellow-300 bg-yellow-50",
                            value >= 32 && "border-green-300 bg-green-50",
                          )}
                        />
                        {value > 0 && (
                          <div className="text-xs text-center">
                            {value < 25 && <span className="text-red-600 font-medium">Critical</span>}
                            {value >= 25 && value < 32 && <span className="text-yellow-600 font-medium">Warning</span>}
                            {value >= 32 && <span className="text-green-600 font-medium">Good</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slip Ring Data - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slip_ring_thickness" className="text-sm font-medium">
                      Slip Ring Thickness
                    </Label>
                    <Input
                      id="slip_ring_thickness"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.slip_ring_thickness}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          slip_ring_thickness: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="mm (typical: 12-15mm)"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Typical range: 12-15mm</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slip_ring_ir" className="text-sm font-medium">
                      Slip Ring IR (1 Minute)
                    </Label>
                    <Input
                      id="slip_ring_ir"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.slip_ring_ir}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, slip_ring_ir: Number.parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="GΩ (minimum: ≥2.0)"
                      className={cn(
                        "w-full",
                        formData.slip_ring_ir > 0 && formData.slip_ring_ir < 2.0 && "border-red-300 bg-red-50",
                        formData.slip_ring_ir >= 2.0 && "border-green-300 bg-green-50",
                      )}
                    />
                    <p className="text-xs text-muted-foreground">Minimum acceptable: ≥2.0 GΩ</p>
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="remarks" className="text-sm font-medium">
                    Remarks
                  </Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Additional notes, observations, or maintenance recommendations..."
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>

                {/* Form Actions - Responsive */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Saving..." : "Save Inspection"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Records Table - Responsive */}
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Recent Inspections</CardTitle>
            <CardDescription className="text-sm sm:text-base">Latest carbon brush inspection records</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 p-4">
                  {records.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No inspection records found.</p>
                      <p className="text-xs">Create your first inspection above.</p>
                    </div>
                  ) : (
                    records.map((record) => {
                      const minMeasurement = Math.min(...Object.values(record.measurements))
                      const forecast = getForecast(record.tagNo)

                      return (
                        <Card key={record.id} className="p-3 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{record.tagNo}</p>
                              <p className="text-xs text-muted-foreground truncate">{record.equipmentName}</p>
                            </div>
                            <Badge
                              variant={
                                minMeasurement < 25 ? "destructive" : minMeasurement < 35 ? "secondary" : "default"
                              }
                              className="text-xs"
                            >
                              {minMeasurement < 25 ? "Critical" : minMeasurement < 35 ? "Warning" : "Good"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Date:</span>
                              <p className="font-medium">{formatDate(record.inspectionDate)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Min:</span>
                              <p className="font-medium">{minMeasurement.toFixed(1)}mm</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">IR:</span>
                              <p className="font-medium">{record.slipRingIr.toFixed(2)} GΩ</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Type:</span>
                              <p className="font-medium">{record.brushType}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateRecordQR(record.id)}
                              className="flex-1"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              QR
                            </Button>
                            {forecast && (
                              <Button
                                size="sm"
                                variant="outline"
                                title={`Predicted replacement: ${formatDate(forecast.predictedReplacementDate.toISOString())}`}
                                className="flex-1 bg-transparent"
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Forecast
                              </Button>
                            )}
                          </div>
                        </Card>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <ScrollArea className="w-full">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">TAG NO</TableHead>
                        <TableHead className="min-w-[150px]">Equipment</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[80px]">Min Measurement</TableHead>
                        <TableHead className="min-w-[80px]">Slip Ring IR</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            <div className="space-y-2">
                              <p>No inspection records found.</p>
                              <p className="text-sm">Create your first inspection above.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        records.map((record) => {
                          const minMeasurement = Math.min(...Object.values(record.measurements))
                          const forecast = getForecast(record.tagNo)

                          return (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">{record.tagNo}</TableCell>
                              <TableCell className="max-w-[200px] truncate" title={record.equipmentName}>
                                {record.equipmentName}
                              </TableCell>
                              <TableCell>{formatDate(record.inspectionDate)}</TableCell>
                              <TableCell>{minMeasurement.toFixed(1)}mm</TableCell>
                              <TableCell>{record.slipRingIr.toFixed(2)} GΩ</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    minMeasurement < 25 ? "destructive" : minMeasurement < 35 ? "secondary" : "default"
                                  }
                                >
                                  {minMeasurement < 25 ? "Critical" : minMeasurement < 35 ? "Warning" : "Good"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => generateRecordQR(record.id)}>
                                    <Download className="w-3 h-3" />
                                  </Button>
                                  {forecast && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      title={`Predicted replacement: ${formatDate(forecast.predictedReplacementDate.toISOString())}`}
                                    >
                                      <TrendingUp className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}

// Add missing cn utility function import
export default withErrorBoundary(CarbonBrushPage)
