"use client"

import type React from "react"
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
import { exportWindingResistanceToExcel, exportSingleWindingResistanceToExcel } from "@/lib/excel-utils"
import { Download, Plus, AlertTriangle, Calendar, User, Settings, Info, Zap, X, CheckCircle, Search, Filter, FileSpreadsheet } from "lucide-react"
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
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [filteredRecords, setFilteredRecords] = useState<WindingResistanceRecord[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const [formData, setFormData] = useState({
    motor_no: "",
    equipment_name: "",
    equipment_type: "Motor",
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
    // Primary Polarization Index (for all voltage types)
    primary_pi: {
      ug_1min: 0,
      ug_10min: 0,
      vg_1min: 0,
      vg_10min: 0,
      wg_1min: 0,
      wg_10min: 0,
      pi_result: 0, // PI result (manual or calculated)
      pi_mode: "manual", // "manual" or "calculated"
    },
    dar_results: {
      ug_result: 0, // Manual DAR result for U-G
      vg_result: 0, // Manual DAR result for V-G  
      wg_result: 0, // Manual DAR result for W-G
    },

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

  // Helper function to calculate PI automatically
  const calculatePI = (phase: 'ug' | 'vg' | 'wg') => {
    const min1 = formData.primary_pi[`${phase}_1min`]
    const min10 = formData.primary_pi[`${phase}_10min`]
    if (min1 > 0 && min10 > 0) {
      return (min10 / min1).toFixed(2)
    }
    return "0.00"
  }

  // Helper function to get average PI when in calculated mode
  const getCalculatedAveragePI = () => {
    const ugPI = parseFloat(calculatePI('ug'))
    const vgPI = parseFloat(calculatePI('vg'))  
    const wgPI = parseFloat(calculatePI('wg'))
    
    if (ugPI > 0 || vgPI > 0 || wgPI > 0) {
      return ((ugPI + vgPI + wgPI) / 3).toFixed(2)
    }
    return "0.00"
  }

  // Helper function to check if any important data is filled
  const hasSignificantData = () => {
    return Object.values(formData.winding_resistance).some(value => value > 0) ||
           Object.values(formData.ir_values).some(value => value > 0) ||
           Object.values(formData.dar_values).some(value => value > 0)
  }

  // Helper function to get voltage title based on equipment type
  const getVoltageTitle = (equipmentType: string) => {
    switch (equipmentType) {
      case "Motor 500v":
        return "500V"
      case "5kv motor":
        return "5kV"
      case "Transformer":
        return "5kV"
      default:
        return "500V"
    }
  }

  // Helper function to get IR Values title based on equipment type
  const getIRTitle = (equipmentType: string) => {
    const voltage = getVoltageTitle(equipmentType)
    if (equipmentType === "Transformer") {
      return `IR Values (primary ${voltage})`
    }
    return `IR Values (${voltage})`
  }

  // Helper function to get DAR Values title based on equipment type
  const getDARTitle = (equipmentType: string) => {
    const voltage = getVoltageTitle(equipmentType)
    if (equipmentType === "Transformer") {
      return `DAR Values (primary ${voltage})`
    }
    return `DAR Values (${voltage})`
  }

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

  // Filter records based on search and filters
  useEffect(() => {
    let filtered = records

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.motorNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.doneBy && record.doneBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.remarks && record.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(record => {
        const avgIR = (record.irValues.ug_1min + record.irValues.vg_1min + record.irValues.wg_1min) / 3
        const status = avgIR >= 10 ? "good" : avgIR >= 1 ? "acceptable" : "poor"
        return status === statusFilter
      })
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
  }, [records, searchTerm, statusFilter, dateFilter])

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
      setFormData((prev) => ({ 
        ...prev, 
        equipment_name: selectedEquipment.equipmentName,
        equipment_type: selectedEquipment.equipmentType || "Motor"
      }))
    }
  }

  const calculateLegacyPI = () => {
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
      const submitData = {
        motor_no: formData.motor_no,
        equipment_name: formData.equipment_name,
        inspection_date: formData.inspection_date,
        done_by: formData.done_by,
        winding_resistance: formData.winding_resistance,
        ir_values: formData.ir_values,
        dar_values: formData.dar_values,
        primary_pi: formData.primary_pi, // Include Primary PI data
        dar_results: formData.dar_results, // Include manual DAR results
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

      let responseData: any
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
          equipment_type: "Motor",
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
          primary_pi: {
            ug_1min: 0,
            ug_10min: 0,
            vg_1min: 0,
            vg_10min: 0,
            wg_1min: 0,
            wg_10min: 0,
            pi_result: 0,
            pi_mode: "manual",
          },
          dar_results: {
            ug_result: 0,
            vg_result: 0,
            wg_result: 0,
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
    
    try {
      // Try to parse as JSON first (equipment QR code)
      const parsed = JSON.parse(data)
      if (parsed.type === "equipment" && parsed.tagNo) {
        setSelectedMotorNo(parsed.tagNo)
        setFormData(prev => ({
          ...prev,
          motor_no: parsed.tagNo,
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
            setSelectedMotorNo(foundEquipment.tagNo)
            setFormData(prev => ({
              ...prev,
              motor_no: foundEquipment.tagNo,
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
        setSelectedMotorNo(foundEquipment.tagNo)
        setFormData(prev => ({
          ...prev,
          motor_no: foundEquipment.tagNo,
          equipment_name: foundEquipment.equipmentName,
          equipment_type: foundEquipment.equipmentType || "Motor"
        }))
      }
    }
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
                      {getIRTitle(formData.equipment_type)}
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
                    <h3 className="text-base sm:text-lg font-semibold">{getDARTitle(formData.equipment_type)}</h3>
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

                {/* Primary Polarization Index */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Primary {getVoltageTitle(formData.equipment_type)} Polarization Index
                    </h3>
                    
                    {/* PI Mode Selection */}
                    <Select
                      value={formData.primary_pi.pi_mode}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        primary_pi: {
                          ...prev.primary_pi,
                          pi_mode: value as "manual" | "calculated"
                        }
                      }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="calculated">Calculated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Time-based measurements table */}
                  <div className="overflow-x-auto">
                    <Table className="border">
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-left font-medium text-gray-900">Time</TableHead>
                          <TableHead className="text-center font-medium text-gray-900">U-G</TableHead>
                          <TableHead className="text-center font-medium text-gray-900">V-G</TableHead>
                          <TableHead className="text-center font-medium text-gray-900">W-G</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">1 Min</TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              value={formData.primary_pi.ug_1min}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                primary_pi: {
                                  ...prev.primary_pi,
                                  ug_1min: parseFloat(e.target.value) || 0
                                }
                              }))}
                              className="text-center text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              value={formData.primary_pi.vg_1min}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                primary_pi: {
                                  ...prev.primary_pi,
                                  vg_1min: parseFloat(e.target.value) || 0
                                }
                              }))}
                              className="text-center text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              value={formData.primary_pi.wg_1min}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                primary_pi: {
                                  ...prev.primary_pi,
                                  wg_1min: parseFloat(e.target.value) || 0
                                }
                              }))}
                              className="text-center text-sm"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">10 Min</TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              value={formData.primary_pi.ug_10min}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                primary_pi: {
                                  ...prev.primary_pi,
                                  ug_10min: parseFloat(e.target.value) || 0
                                }
                              }))}
                              className="text-center text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              value={formData.primary_pi.vg_10min}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                primary_pi: {
                                  ...prev.primary_pi,
                                  vg_10min: parseFloat(e.target.value) || 0
                                }
                              }))}
                              className="text-center text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              value={formData.primary_pi.wg_10min}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                primary_pi: {
                                  ...prev.primary_pi,
                                  wg_10min: parseFloat(e.target.value) || 0
                                }
                              }))}
                              className="text-center text-sm"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-50">
                          <TableCell className="font-medium text-blue-800">PI Result</TableCell>
                          <TableCell className="p-2" colSpan={3}>
                            {formData.primary_pi.pi_mode === "calculated" ? (
                              <div className="text-center text-sm font-medium">
                                <div className="text-lg text-blue-700 font-bold">
                                  {getCalculatedAveragePI()}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  U-G: {calculatePI('ug')} | V-G: {calculatePI('vg')} | W-G: {calculatePI('wg')}
                                </div>
                              </div>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.primary_pi.pi_result}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  primary_pi: {
                                    ...prev.primary_pi,
                                    pi_result: parseFloat(e.target.value) || 0
                                  }
                                }))}
                                className="text-center text-sm font-medium"
                                placeholder="Enter PI result"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Formula reference */}
                  <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                    <strong>Formula:</strong> PI = IR(10min) / IR(1min) | 
                    <strong> Acceptable:</strong> ≥1.5 | 
                    <strong> Good:</strong> ≥2.0 | 
                    <strong> Excellent:</strong> ≥4.0
                  </div>
                </div>

                {/* Manual Results Entry */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold">Results (Manual Entry)</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Manual DAR Results */}
                    <div className="p-3 border rounded-lg">
                      <Label className="text-sm font-medium">DAR Results</Label>
                      <div className="space-y-2 mt-2">
                        <div>
                          <Label htmlFor="dar_ug" className="text-xs">U-G DAR Result</Label>
                          <Input
                            id="dar_ug"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.dar_results.ug_result}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              dar_results: {
                                ...prev.dar_results,
                                ug_result: parseFloat(e.target.value) || 0
                              }
                            }))}
                            placeholder="U-G DAR"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dar_vg" className="text-xs">V-G DAR Result</Label>
                          <Input
                            id="dar_vg"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.dar_results.vg_result}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              dar_results: {
                                ...prev.dar_results,
                                vg_result: parseFloat(e.target.value) || 0
                              }
                            }))}
                            placeholder="V-G DAR"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dar_wg" className="text-xs">W-G DAR Result</Label>
                          <Input
                            id="dar_wg"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.dar_results.wg_result}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              dar_results: {
                                ...prev.dar_results,
                                wg_result: parseFloat(e.target.value) || 0
                              }
                            }))}
                            placeholder="W-G DAR"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formula: DAR = IR(1min) / IR(30sec)
                      </p>
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

        {/* Search and Filters Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Search & Filter Tests</CardTitle>
                <CardDescription>Find specific winding resistance tests</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportWindingResistanceToExcel(filteredRecords, searchTerm !== "" || statusFilter !== "all" || dateFilter !== "all")}
                  className="w-full sm:w-auto"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full sm:w-auto"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by motor number, technician, or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="good">Good (≥10 GΩ)</SelectItem>
                      <SelectItem value="acceptable">Acceptable (≥1 GΩ)</SelectItem>
                      <SelectItem value="poor">Poor (&lt;1 GΩ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="quarter">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setDateFilter("all")
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredRecords.length} of {records.length} test records
            </div>
          </CardContent>
        </Card>

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
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No test records found.</p>
                      <p className="text-xs">
                        {records.length === 0 ? "Create your first test above." : "Try adjusting your search or filters."}
                      </p>
                    </div>
                  ) : (
                    filteredRecords.map((record) => {
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportSingleWindingResistanceToExcel(record)}
                              className="flex-1"
                            >
                              <FileSpreadsheet className="w-3 h-3 mr-1" />
                              Excel
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
                      {filteredRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            <div className="space-y-2">
                              <p>No test records found.</p>
                              <p className="text-sm">
                                {records.length === 0 ? "Create your first test above." : "Try adjusting your search or filters."}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords.map((record) => {
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
                                  <Button size="sm" variant="outline" onClick={() => exportSingleWindingResistanceToExcel(record)}>
                                    <FileSpreadsheet className="w-3 h-3" />
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
