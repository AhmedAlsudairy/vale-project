"use client"

import type React from "react"
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
import { Download, Plus, AlertTriangle, Calendar, User, Settings, Info, Zap, X, CheckCircle } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ErrorBoundary } from "@/components/error-boundary"

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

interface Equipment {
  id: number
  tagNo: string
  equipmentName: string
  equipmentType: string
  location: string | null
}

export default function WindingResistancePage() {
  const [records, setRecords] = useState<WindingResistanceRecord[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [selectedMotorNo, setSelectedMotorNo] = useState("")
  const [previousRecords, setPreviousRecords] = useState<WindingResistanceRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Add success state
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    motor_no: "",
    equipment_name: "",
    inspection_date: new Date().toISOString().split("T")[0],
    done_by: "",
    winding_resistance: {
      ry: 0,
      yb: 0,
      rb: 0,
    },
    ir_values: {
      ug_1min: 0,
      ug_10min: 0,
      vg_1min: 0,
      vg_10min: 0,
      wg_1min: 0,
      wg_10min: 0,
    },
    dar_values: {
      ug_30sec: 0,
      ug_1min: 0,
      vg_30sec: 0,
      vg_1min: 0,
      wg_30sec: 0,
      wg_1min: 0,
    },
    remarks: "",
  })

  // Reference values for guidance
  const referenceValues = {
    windingResistance: {
      typical: "0.1-10",
      unit: "Ω",
      note: "Varies by motor rating",
    },
    irValues: {
      minimum: "≥1.0",
      good: "≥10",
      unit: "GΩ at 500V",
      note: "Higher values indicate better insulation",
    },
    polarizationIndex: {
      minimum: "≥1.5",
      good: "≥2.0",
      excellent: "≥4.0",
      formula: "PI = IR(10min) / IR(1min)",
    },
    darValues: {
      minimum: "≥1.25",
      good: "≥1.6",
      excellent: "≥4.0",
      formula: "DAR = IR(1min) / IR(30sec)",
    },
  }

  useEffect(() => {
    fetchRecords()
    fetchEquipment()
  }, [])

  useEffect(() => {
    if (selectedMotorNo) {
      fetchPreviousRecords(selectedMotorNo)
    }
  }, [selectedMotorNo])

  const fetchRecords = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/winding-resistance")

      if (response.ok) {
        const data = await response.json()
        setRecords(data)
        setError(null)
      } else {
        // Mock data for demo
        setRecords([
          {
            id: 1,
            motorNo: "BO.3161.04.M1",
            windingResistance: { ry: 2.5, yb: 2.4, rb: 2.6 },
            irValues: {
              ug_1min: 15.2,
              ug_10min: 18.5,
              vg_1min: 14.8,
              vg_10min: 17.9,
              wg_1min: 15.1,
              wg_10min: 18.2,
            },
            polarizationIndex: 1.22,
            darValues: {
              ug_30sec: 12.1,
              ug_1min: 15.2,
              vg_30sec: 11.8,
              vg_1min: 14.8,
              wg_30sec: 12.0,
              wg_1min: 15.1,
            },
            inspectionDate: "2024-01-15",
            doneBy: "John Smith",
            remarks: "All values within acceptable range",
            createdAt: "2024-01-15T10:30:00Z",
          },
        ])
        setError("Database temporarily unavailable. Showing demo data.")
      }
    } catch (error) {
      console.error("Error fetching records:", error)
      setError("Failed to load winding resistance records")
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await fetch("/api/equipment")
      const data = await response.json()

      if (response.ok) {
        setEquipment(data)
      } else {
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
    } catch (error) {
      console.error("Error fetching equipment:", error)
    }
  }

  const fetchPreviousRecords = async (motorNo: string) => {
    try {
      const response = await fetch(`/api/winding-resistance?motor_no=${motorNo}&limit=3`)
      if (response.ok) {
        const data = await response.json()
        setPreviousRecords(data)
      }
    } catch (error) {
      console.error("Error fetching previous records:", error)
      setPreviousRecords([])
    }
  }

  const handleMotorNoChange = (motorNo: string) => {
    setSelectedMotorNo(motorNo)
    setFormData((prev) => ({ ...prev, motor_no: motorNo }))

    const selectedEquipment = equipment.find((eq) => eq.tagNo === motorNo)
    if (selectedEquipment) {
      setFormData((prev) => ({ ...prev, equipment_name: selectedEquipment.equipmentName }))
    }
  }

  const calculatePI = () => {
    const avgPI = [
      formData.ir_values.ug_10min / formData.ir_values.ug_1min,
      formData.ir_values.vg_10min / formData.ir_values.vg_1min,
      formData.ir_values.wg_10min / formData.ir_values.wg_1min,
    ].filter((val) => !isNaN(val) && isFinite(val))

    return avgPI.length > 0 ? avgPI.reduce((a, b) => a + b) / avgPI.length : 0
  }

  const calculateDAR = (phase: "ug" | "vg" | "wg") => {
    const oneMin = formData.dar_values[`${phase}_1min` as keyof typeof formData.dar_values]
    const thirtySec = formData.dar_values[`${phase}_30sec` as keyof typeof formData.dar_values]
    return thirtySec > 0 ? oneMin / thirtySec : 0
  }

  // Add this validation function before handleSubmit
  const validateForm = () => {
    const errors: string[] = []

    if (!formData.motor_no.trim()) {
      errors.push("Motor No is required")
    }

    if (!formData.equipment_name.trim()) {
      errors.push("Equipment Name is required")
    }

    if (!formData.inspection_date) {
      errors.push("Test Date is required")
    }

    // Check if at least some winding resistance values are filled
    const windingValues = Object.values(formData.winding_resistance)
    if (windingValues.every((val) => val === 0)) {
      errors.push("At least one winding resistance value is required")
    }

    // Check if at least some IR values are filled
    const irValues = Object.values(formData.ir_values)
    if (irValues.every((val) => val === 0)) {
      errors.push("At least one IR value is required")
    }

    return errors
  }

  // Update handleSubmit to include validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(`Please fix the following errors: ${validationErrors.join(", ")}`)
      return
    }

    setIsSubmitting(true)
    setError(null) // Clear previous errors

    try {
      const calculatedPI = calculatePI()

      const submitData = {
        motor_no: formData.motor_no,
        equipment_name: formData.equipment_name,
        inspection_date: formData.inspection_date,
        done_by: formData.done_by,
        winding_resistance: formData.winding_resistance,
        ir_values: formData.ir_values,
        dar_values: formData.dar_values,
        polarization_index: calculatedPI,
        remarks: formData.remarks,
      }

      console.log("Submitting winding resistance data:", submitData) // Debug log

      const response = await fetch("/api/winding-resistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(submitData),
      })

      let responseData
      try {
        const responseText = await response.text()
        console.log("Raw response:", responseText) // Debug log

        if (!responseText) {
          throw new Error("Empty response from server")
        }

        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        throw new Error("Invalid response format from server")
      }

      console.log("Parsed response:", responseData) // Debug log

      if (response.ok) {
        setRecords((prev) => [responseData, ...prev])

        // Reset form
        setFormData({
          motor_no: "",
          equipment_name: "",
          inspection_date: new Date().toISOString().split("T")[0],
          done_by: "",
          winding_resistance: { ry: 0, yb: 0, rb: 0 },
          ir_values: {
            ug_1min: 0,
            ug_10min: 0,
            vg_1min: 0,
            vg_10min: 0,
            wg_1min: 0,
            wg_10min: 0,
          },
          dar_values: {
            ug_30sec: 0,
            ug_1min: 0,
            vg_30sec: 0,
            vg_1min: 0,
            wg_30sec: 0,
            wg_1min: 0,
          },
          remarks: "",
        })

        setShowForm(false)
        setSelectedMotorNo("")
        setPreviousRecords([])
        setError(null)
        setSuccessMessage(`Winding resistance test for ${responseData.motorNo} saved successfully!`)

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        throw new Error(responseData.error || `Server error: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setError(`Failed to save winding resistance record: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQRScan = (data: string) => {
    console.log("QR Scanned:", data)
  }

  const generateRecordQR = async (recordId: number) => {
    try {
      const qrCode = await generateQR(recordId, "winding-resistance")
      const link = document.createElement("a")
      link.download = `winding-resistance-${recordId}-qr.png`
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
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const getIRStatus = (value: number) => {
    if (value >= 10) return { status: "good", color: "text-green-600" }
    if (value >= 1) return { status: "acceptable", color: "text-yellow-600" }
    return { status: "poor", color: "text-red-600" }
  }

  const getPIStatus = (pi: number) => {
    if (pi >= 4.0) return { status: "excellent", color: "text-green-600" }
    if (pi >= 2.0) return { status: "good", color: "text-green-600" }
    if (pi >= 1.5) return { status: "acceptable", color: "text-yellow-600" }
    return { status: "poor", color: "text-red-600" }
  }

  const getDARStatus = (dar: number) => {
    if (dar >= 4.0) return { status: "excellent", color: "text-green-600" }
    if (dar >= 1.6) return { status: "good", color: "text-green-600" }
    if (dar >= 1.25) return { status: "acceptable", color: "text-yellow-600" }
    return { status: "poor", color: "text-red-600" }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm sm:text-base">Loading winding resistance data...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold">Winding Resistance Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track motor winding resistance, IR values, and insulation health
            </p>
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
                  New Test
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

        {/* Add success message display after error alert */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 text-green-800 flex-1">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm sm:text-base font-medium">Success</p>
                    <p className="text-xs sm:text-sm mt-1">{successMessage}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSuccessMessage(null)}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
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
              Winding Resistance Test Reference Values
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-blue-800">Winding Resistance</p>
                <p className="text-blue-700">
                  Typical:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">
                    {referenceValues.windingResistance.typical}Ω
                  </span>
                </p>
                <p className="text-xs text-blue-600">{referenceValues.windingResistance.note}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-800">IR Values (500V)</p>
                <p className="text-blue-700">
                  Minimum:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">{referenceValues.irValues.minimum} GΩ</span>
                </p>
                <p className="text-blue-700">
                  Good: <span className="font-mono bg-blue-100 px-1 rounded">{referenceValues.irValues.good} GΩ</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-800">Polarization Index (PI)</p>
                <p className="text-blue-700">
                  Minimum:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">
                    {referenceValues.polarizationIndex.minimum}
                  </span>
                </p>
                <p className="text-blue-700">
                  Good:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">{referenceValues.polarizationIndex.good}</span>
                </p>
                <p className="text-xs text-blue-600">{referenceValues.polarizationIndex.formula}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-800">DAR Values</p>
                <p className="text-blue-700">
                  Minimum:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">{referenceValues.darValues.minimum}</span>
                </p>
                <p className="text-blue-700">
                  Good: <span className="font-mono bg-blue-100 px-1 rounded">{referenceValues.darValues.good}</span>
                </p>
                <p className="text-xs text-blue-600">{referenceValues.darValues.formula}</p>
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
                  <CardTitle className="text-lg sm:text-xl">Winding Resistance Test Form</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Record motor winding resistance, IR values, and insulation test data
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
                    <Label htmlFor="motor_no" className="text-sm font-medium">
                      Motor No
                    </Label>
                    <Combobox
                      options={equipment.map((eq) => ({
                        value: eq.tagNo,
                        label: `${eq.tagNo} - ${eq.equipmentName}`,
                      }))}
                      value={formData.motor_no}
                      onValueChange={handleMotorNoChange}
                      placeholder="Select or add Motor No (e.g., BO.3161.04.M1)"
                      searchPlaceholder="Search Motor No..."
                      allowCustom={true}
                      onAddNew={(newMotorNo) => {
                        const newEquipment = {
                          id: Date.now(),
                          tagNo: newMotorNo,
                          equipmentName: `New Motor - ${newMotorNo}`,
                          equipmentType: "Motor",
                          location: null,
                        }
                        setEquipment((prev) => [...prev, newEquipment])
                      }}
                    />
                    {previousRecords.length > 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                        <p className="font-medium mb-1">Previous tests:</p>
                        {previousRecords.slice(0, 2).map((record) => (
                          <p key={record.id} className="truncate">
                            {formatDate(record.inspectionDate)} - PI: {record.polarizationIndex?.toFixed(2) || "N/A"}
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
                    <Label htmlFor="inspection_date" className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Test Date
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
                    <Label htmlFor="done_by" className="text-sm font-medium flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Done By
                    </Label>
                    <Input
                      id="done_by"
                      value={formData.done_by}
                      onChange={(e) => setFormData((prev) => ({ ...prev, done_by: e.target.value }))}
                      placeholder="Technician Name"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Winding Resistance - Responsive Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Winding Resistance
                    </h3>
                    <div className="text-xs text-muted-foreground">
                      Reference: {referenceValues.windingResistance.typical}Ω
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(formData.winding_resistance).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-sm font-medium">
                          {key.toUpperCase().replace("", "-")} Phase
                        </Label>
                        <Input
                          id={key}
                          type="number"
                          step="0.01"
                          min="0"
                          value={value}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              winding_resistance: {
                                ...prev.winding_resistance,
                                [key]: Number.parseFloat(e.target.value) || 0,
                              },
                            }))
                          }
                          placeholder="Ω"
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* IR Values - Responsive Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      IR Values (500V)
                    </h3>
                    <div className="text-xs text-muted-foreground">Reference: Min ≥1.0 GΩ, Good ≥10 GΩ</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { phase: "U-G", key1: "ug_1min", key10: "ug_10min" },
                      { phase: "V-G", key1: "vg_1min", key10: "vg_10min" },
                      { phase: "W-G", key1: "wg_1min", key10: "wg_10min" },
                    ].map(({ phase, key1, key10 }) => (
                      <div key={phase} className="space-y-3 p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">{phase} Phase</h4>
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={key1} className="text-xs">
                              1 Minute
                            </Label>
                            <Input
                              id={key1}
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.ir_values[key1 as keyof typeof formData.ir_values]}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  ir_values: {
                                    ...prev.ir_values,
                                    [key1]: Number.parseFloat(e.target.value) || 0,
                                  },
                                }))
                              }
                              placeholder="GΩ"
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={key10} className="text-xs">
                              10 Minutes
                            </Label>
                            <Input
                              id={key10}
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.ir_values[key10 as keyof typeof formData.ir_values]}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  ir_values: {
                                    ...prev.ir_values,
                                    [key10]: Number.parseFloat(e.target.value) || 0,
                                  },
                                }))
                              }
                              placeholder="GΩ"
                              className="w-full text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DAR Values - Responsive Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold">DAR Values (500V)</h3>
                    <div className="text-xs text-muted-foreground">Reference: Min ≥1.25, Good ≥1.6</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { phase: "U-G", key30: "ug_30sec", key1: "ug_1min" },
                      { phase: "V-G", key30: "vg_30sec", key1: "vg_1min" },
                      { phase: "W-G", key30: "wg_30sec", key1: "wg_1min" },
                    ].map(({ phase, key30, key1 }) => {
                      const darValue = calculateDAR(phase.toLowerCase().split("-")[0] as "ug" | "vg" | "wg")
                      const darStatus = getDARStatus(darValue)

                      return (
                        <div key={phase} className="space-y-3 p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-sm">{phase} Phase</h4>
                            {darValue > 0 && (
                              <span className={`text-xs font-medium ${darStatus.color}`}>
                                DAR: {darValue.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor={key30} className="text-xs">
                                30 Seconds
                              </Label>
                              <Input
                                id={key30}
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.dar_values[key30 as keyof typeof formData.dar_values]}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    dar_values: {
                                      ...prev.dar_values,
                                      [key30]: Number.parseFloat(e.target.value) || 0,
                                    },
                                  }))
                                }
                                placeholder="GΩ"
                                className="w-full text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={key1} className="text-xs">
                                1 Minute
                              </Label>
                              <Input
                                id={key1}
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.dar_values[key1 as keyof typeof formData.dar_values]}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    dar_values: {
                                      ...prev.dar_values,
                                      [key1]: Number.parseFloat(e.target.value) || 0,
                                    },
                                  }))
                                }
                                placeholder="GΩ"
                                className="w-full text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Calculated Results */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold">Calculated Results</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg bg-muted/20">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Polarization Index (PI)</span>
                        <span className={`text-sm font-bold ${getPIStatus(calculatePI()).color}`}>
                          {calculatePI() > 0 ? calculatePI().toFixed(2) : "N/A"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{referenceValues.polarizationIndex.formula}</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/20">
                      <span className="text-sm font-medium">DAR Results</span>
                      <div className="mt-2 space-y-1">
                        {["ug", "vg", "wg"].map((phase) => {
                          const darValue = calculateDAR(phase as "ug" | "vg" | "wg")
                          const darStatus = getDARStatus(darValue)
                          return (
                            <div key={phase} className="flex justify-between text-xs">
                              <span>{phase.toUpperCase()}-G:</span>
                              <span className={darStatus.color}>{darValue > 0 ? darValue.toFixed(2) : "N/A"}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
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
                    placeholder="Test conditions, observations, recommendations..."
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>

                {/* Form Actions - Responsive */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Saving..." : "Save Test Results"}
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
            <CardTitle className="text-lg sm:text-xl">Recent Tests</CardTitle>
            <CardDescription className="text-sm sm:text-base">Latest winding resistance test records</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 p-4">
                  {records.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No test records found.</p>
                      <p className="text-xs">Create your first test above.</p>
                    </div>
                  ) : (
                    records.map((record) => {
                      const avgIR = (record.irValues.ug_1min + record.irValues.vg_1min + record.irValues.wg_1min) / 3
                      const piStatus = getPIStatus(record.polarizationIndex || 0)

                      return (
                        <Card key={record.id} className="p-3 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{record.motorNo}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(record.inspectionDate)}</p>
                            </div>
                            <Badge
                              variant={avgIR >= 10 ? "default" : avgIR >= 1 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {avgIR >= 10 ? "Good" : avgIR >= 1 ? "Acceptable" : "Poor"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Avg IR:</span>
                              <p className="font-medium">{avgIR.toFixed(1)} GΩ</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">PI:</span>
                              <p className={`font-medium ${piStatus.color}`}>
                                {record.polarizationIndex?.toFixed(2) || "N/A"}
                              </p>
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
                        <TableHead className="min-w-[120px]">Motor No</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[80px]">Avg IR</TableHead>
                        <TableHead className="min-w-[60px]">PI</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            <div className="space-y-2">
                              <p>No test records found.</p>
                              <p className="text-sm">Create your first test above.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        records.map((record) => {
                          const avgIR =
                            (record.irValues.ug_1min + record.irValues.vg_1min + record.irValues.wg_1min) / 3
                          const piStatus = getPIStatus(record.polarizationIndex || 0)

                          return (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">{record.motorNo}</TableCell>
                              <TableCell>{formatDate(record.inspectionDate)}</TableCell>
                              <TableCell>{avgIR.toFixed(1)} GΩ</TableCell>
                              <TableCell className={piStatus.color}>
                                {record.polarizationIndex?.toFixed(2) || "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={avgIR >= 10 ? "default" : avgIR >= 1 ? "secondary" : "destructive"}>
                                  {avgIR >= 10 ? "Good" : avgIR >= 1 ? "Acceptable" : "Poor"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => generateRecordQR(record.id)}>
                                    <Download className="w-3 h-3" />
                                  </Button>
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

// Add missing cn utility function
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}
