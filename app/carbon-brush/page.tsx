"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { QRScanner } from "@/components/qr-scanner"
import { generateQR } from "@/lib/qr-utils"
import { forecastBrushLife } from "@/lib/forecast"
import { exportCarbonBrushToExcel, exportSingleCarbonBrushToExcel } from "@/lib/excel-utils"
import { Download, Plus, TrendingUp, AlertTriangle, Calendar, User, FileText, Settings, Info, X, Search, Filter, FileSpreadsheet } from "lucide-react"
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
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [brushTypeFilter, setBrushTypeFilter] = useState<string>("all")
  const [filteredRecords, setFilteredRecords] = useState<CarbonBrushRecord[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
  const [brushTypes, setBrushTypes] = useState([
    { value: "C80X", label: "C80X" },
    { value: "C60X", label: "C60X" },
    { value: "C100X", label: "C100X" },
  ])

  const [formData, setFormData] = useState({
    tag_no: "",
    equipment_name: "",
    equipment_type: "Motor",
    brush_type: "C80X",
    inspection_date: new Date().toISOString().split("T")[0],
    work_order_no: "",
    done_by: "",
    measurements: {
      "1A_inner": 0,
      "1A_center": 0,
      "1A_outer": 0,
      "1B_inner": 0,
      "1B_center": 0,
      "1B_outer": 0,
      "2A_inner": 0,
      "2A_center": 0,
      "2A_outer": 0,
      "2B_inner": 0,
      "2B_center": 0,
      "2B_outer": 0,
      "3A_inner": 0,
      "3A_center": 0,
      "3A_outer": 0,
      "3B_inner": 0,
      "3B_center": 0,
      "3B_outer": 0,
      "4A_inner": 0,
      "4A_center": 0,
      "4A_outer": 0,
      "4B_inner": 0,
      "4B_center": 0,
      "4B_outer": 0,
      "5A_inner": 0,
      "5A_center": 0,
      "5A_outer": 0,
      "5B_inner": 0,
      "5B_center": 0,
      "5B_outer": 0,
    },
    slip_ring_thickness: 0,
    slip_ring_ir: 0,
    remarks: "",
  })

  // Equipment types available
  const equipmentTypes = [
    "Motor",
    "Motor 500v",
    "5kv motor",
    "Generator",
    "Transformer",
    "Pump",
    "Compressor",
    "Fan",
    "Conveyor",
    "Crusher",
    "Mill",
    "Other"
  ]

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

  // Filter records based on search and filters
  useEffect(() => {
    let filtered = records

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.tagNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.brushType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.doneBy && record.doneBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.remarks && record.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter based on brush wear
    if (statusFilter !== "all") {
      filtered = filtered.filter(record => {
        const measurements = Object.values(record.measurements)
        const avgMeasurement = measurements.reduce((sum, val) => sum + val, 0) / measurements.length
        const status = avgMeasurement >= 25 ? "good" : avgMeasurement >= 15 ? "acceptable" : "poor"
        return status === statusFilter
      })
    }

    // Brush type filter
    if (brushTypeFilter !== "all") {
      filtered = filtered.filter(record => record.brushType === brushTypeFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.inspectionDate)
        const diffTime = Math.abs(now.getTime() - recordDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        switch (dateFilter) {
          case "week":
            return diffDays <= 7
          case "month":
            return diffDays <= 30
          case "quarter":
            return diffDays <= 90
          default:
            return true
        }
      })
    }

    setFilteredRecords(filtered)
  }, [records, searchTerm, statusFilter, dateFilter, brushTypeFilter])

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
      setFormData((prev) => ({ 
        ...prev, 
        equipment_name: selectedEquipment.equipmentName,
        equipment_type: selectedEquipment.equipmentType || "Motor"
      }))
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
          equipment_type: "Motor",
          brush_type: "C80X",
          inspection_date: new Date().toISOString().split("T")[0],
          work_order_no: "",
          done_by: "",
          measurements: {
            "1A_inner": 0,
            "1A_center": 0,
            "1A_outer": 0,
            "1B_inner": 0,
            "1B_center": 0,
            "1B_outer": 0,
            "2A_inner": 0,
            "2A_center": 0,
            "2A_outer": 0,
            "2B_inner": 0,
            "2B_center": 0,
            "2B_outer": 0,
            "3A_inner": 0,
            "3A_center": 0,
            "3A_outer": 0,
            "3B_inner": 0,
            "3B_center": 0,
            "3B_outer": 0,
            "4A_inner": 0,
            "4A_center": 0,
            "4A_outer": 0,
            "4B_inner": 0,
            "4B_center": 0,
            "4B_outer": 0,
            "5A_inner": 0,
            "5A_center": 0,
            "5A_outer": 0,
            "5B_inner": 0,
            "5B_center": 0,
            "5B_outer": 0,
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
          equipment_name: parsed.equipmentName || "",
          equipment_type: parsed.equipmentType || "Motor"
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
              equipment_name: foundEquipment.equipmentName,
              equipment_type: foundEquipment.equipmentType || "Motor"
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
          equipment_name: foundEquipment.equipmentName,
          equipment_type: foundEquipment.equipmentType || "Motor"
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
                    <Label htmlFor="equipment_type" className="text-sm font-medium">
                      Equipment Type
                    </Label>
                    <Select 
                      value={formData.equipment_type} 
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, equipment_type: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select equipment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                {/* Brush Measurements - Table Format */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Carbon Brush Measurements
                    </h3>
                    <div className="text-xs text-muted-foreground">Reference: H≥25mm, B=32mm, L=50mm</div>
                  </div>
                  
                  {/* Measurements Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-700">
                          <TableHead className="font-semibold text-center border-r text-gray-900 dark:text-gray-100">BRUSH HOLDER NUMBER</TableHead>
                          <TableHead className="font-semibold text-center border-r text-gray-900 dark:text-gray-100">1-A mm</TableHead>
                          <TableHead className="font-semibold text-center border-r text-gray-900 dark:text-gray-100">1-B mm</TableHead>
                          <TableHead className="font-semibold text-center border-r text-gray-900 dark:text-gray-100">2-A mm</TableHead>
                          <TableHead className="font-semibold text-center border-r text-gray-900 dark:text-gray-100">2-B mm</TableHead>
                          <TableHead className="font-semibold text-center border-r text-gray-900 dark:text-gray-100">3-A mm</TableHead>
                          <TableHead className="font-semibold text-center border-r text-gray-900 dark:text-gray-100">3-B mm</TableHead>
                          <TableHead className="font-semibold text-center border-r text-gray-900 dark:text-gray-100">4-A mm</TableHead>
                          <TableHead className="font-semibold text-center border-r text-gray-900 dark:text-gray-100">4-B mm</TableHead>
                          <TableHead className="font-semibold text-center border-r text-gray-900 dark:text-gray-100">5-A mm</TableHead>
                          <TableHead className="font-semibold text-center text-gray-900 dark:text-gray-100">5-B mm</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Inner Ring Row */}
                        <TableRow>
                          <TableCell className="font-medium bg-gray-50 dark:bg-gray-700 border-r text-center text-gray-900 dark:text-gray-100">SLIP RING INNER</TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["1A_inner"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "1A_inner": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["1B_inner"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "1B_inner": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["2A_inner"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "2A_inner": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["2B_inner"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "2B_inner": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["3A_inner"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "3A_inner": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["3B_inner"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "3B_inner": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["4A_inner"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "4A_inner": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["4B_inner"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "4B_inner": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["5A_inner"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "5A_inner": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["5B_inner"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "5B_inner": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                        </TableRow>
                        
                        {/* Center Ring Row */}
                        <TableRow>
                          <TableCell className="font-medium bg-gray-50 dark:bg-gray-700 border-r text-center text-gray-900 dark:text-gray-100">SLIP RING CENTER</TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["1A_center"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "1A_center": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["1B_center"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "1B_center": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["2A_center"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "2A_center": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["2B_center"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "2B_center": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["3A_center"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "3A_center": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["3B_center"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "3B_center": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["4A_center"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "4A_center": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["4B_center"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "4B_center": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["5A_center"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "5A_center": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["5B_center"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "5B_center": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                        </TableRow>
                        
                        {/* Outer Ring Row */}
                        <TableRow>
                          <TableCell className="font-medium bg-gray-50 dark:bg-gray-700 border-r text-center text-gray-900 dark:text-gray-100">SLIP RING OUTER</TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["1A_outer"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "1A_outer": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["1B_outer"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "1B_outer": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["2A_outer"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "2A_outer": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["2B_outer"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "2B_outer": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["3A_outer"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "3A_outer": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["3B_outer"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "3B_outer": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["4A_outer"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "4A_outer": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["4B_outer"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "4B_outer": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="border-r p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["5A_outer"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "5A_outer": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.measurements["5B_outer"]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, "5B_outer": Number.parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full h-8 text-center border-0 focus:ring-1"
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
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
                      className={cn(
                        "w-full font-medium",
                        formData.slip_ring_thickness > 0 && formData.slip_ring_thickness < 12 && "border-red-400 bg-red-50 text-red-900",
                        formData.slip_ring_thickness >= 12 && formData.slip_ring_thickness <= 15 && "border-green-400 bg-green-50 text-green-900",
                        formData.slip_ring_thickness > 15 && "border-yellow-400 bg-yellow-50 text-yellow-900"
                      )}
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
                        "w-full font-medium",
                        formData.slip_ring_ir > 0 && formData.slip_ring_ir < 2.0 && "border-red-400 bg-red-50 text-red-900",
                        formData.slip_ring_ir >= 2.0 && "border-green-400 bg-green-50 text-green-900",
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
          
          {/* Search and Filter Controls */}
          <div className="px-6 pb-4">
            <div className="flex flex-col gap-4">
              {/* Search bar and filter toggle */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Tag No, Equipment Name, Brush Type, Technician, or Remarks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => exportCarbonBrushToExcel(filteredRecords, searchTerm !== "" || statusFilter !== "all" || dateFilter !== "all" || brushTypeFilter !== "all")}
                  className="shrink-0"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="shrink-0"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters {(statusFilter !== "all" || dateFilter !== "all" || brushTypeFilter !== "all") && 
                    <Badge variant="secondary" className="ml-2">•</Badge>}
                </Button>
              </div>

              {/* Filter options */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="good">Good (≥25)</SelectItem>
                        <SelectItem value="acceptable">Acceptable (15-24)</SelectItem>
                        <SelectItem value="poor">Poor (&lt;15)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Brush Type</label>
                <Select value={brushTypeFilter} onValueChange={setBrushTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="C80X">C80X</SelectItem>
                    <SelectItem value="C60X">C60X</SelectItem>
                    <SelectItem value="C100X">C100X</SelectItem>
                  </SelectContent>
                </Select>
              </div>                  <div>
                    <label className="text-sm font-medium mb-2 block">Date Range</label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="quarter">Last Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        setStatusFilter("all")
                        setDateFilter("all")
                        setBrushTypeFilter("all")
                      }}
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}

              {/* Results count */}
              <div className="text-sm text-muted-foreground">
                Showing {filteredRecords.length} of {records.length} records
              </div>
            </div>
          </div>

          <CardContent className="p-0 sm:p-6">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 p-4">
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No inspection records found.</p>
                      <p className="text-xs">
                        {searchTerm || statusFilter !== "all" || dateFilter !== "all" || brushTypeFilter !== "all" 
                          ? "Try adjusting your search or filters." 
                          : "Create your first inspection above."}
                      </p>
                    </div>
                  ) : (
                    filteredRecords.map((record) => {
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportSingleCarbonBrushToExcel(record)}
                              className="flex-1"
                            >
                              <FileSpreadsheet className="w-3 h-3 mr-1" />
                              Excel
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
                      {filteredRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            <div className="space-y-2">
                              <p>No inspection records found.</p>
                              <p className="text-sm">
                                {searchTerm || statusFilter !== "all" || dateFilter !== "all" || brushTypeFilter !== "all"
                                  ? "Try adjusting your search or filters."
                                  : "Create your first inspection above."}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords.map((record) => {
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
                                  <Button size="sm" variant="outline" onClick={() => exportSingleCarbonBrushToExcel(record)}>
                                    <FileSpreadsheet className="w-3 h-3" />
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
