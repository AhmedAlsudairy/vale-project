'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CalendarIcon, Download, Plus, Search, Thermometer, Zap, ChevronRight, ChevronDown, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Combobox } from '@/components/ui/combobox'
import { useToast } from '@/components/ui/use-toast'
import { QRScanner } from '@/components/qr-scanner'

interface Equipment {
  id: number
  tagNo: string
  equipmentName: string
  equipmentType: string
  location: string | null
}

interface EspSession {
  id: number
  espCode: string
  inspectionDate: string
  month: number
  doneBy?: string
  step: number
  isCompleted: boolean
  remarks?: string
  createdAt: string
  transformerRecords: TransformerRecord[]
}

interface TransformerRecord {
  id: number
  transformerNo: string
  step: number
  mccbIcRPhase?: number
  mccbIcBPhase?: number
  mccbCOg1?: number
  mccbCOg2?: number
  mccbBodyTemp?: number
  kvMa?: string
  spMin?: string
  scrCoolingFinsTemp?: number
  scrCoolingFan?: string
  panelExhaustFan?: string
  mccForcedCoolingFanTemp?: string
  rdi68?: number
  rdi69?: number
  rdi70?: number
}

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const espCodes = ['ESP-01', 'ESP-02', 'ESP-03', 'ESP-04', 'ESP-05']
const transformers = ['TF1', 'TF2', 'TF3']
const equipmentTypes = [
  'ESP (Electrostatic Precipitator)',
  'ESP - Transformer',
  'ESP - MCC Panel',
  'ESP - Control System',
  'ESP - Feeder',
  'Motor',
  'Pump',
  'Fan',
  'Compressor',
  'Other'
]

export default function ThermographyPage() {
  const { toast } = useToast()
  const [sessions, setSessions] = useState<EspSession[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState<EspSession | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEsp, setSelectedEsp] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())

  // Form state
  const [formData, setFormData] = useState({
    espCode: '',
    equipmentName: '',
    equipmentType: '',
    inspectionDate: undefined as Date | undefined,
    month: '',
    doneBy: '',
    remarks: '',
    transformers: [
      {
        transformerNo: 'TF1',
        mccbIcRPhase: '',
        mccbIcBPhase: '',
        mccbCOg1: '',
        mccbCOg2: '',
        mccbBodyTemp: '',
        kvMa: '',
        spMin: '',
        scrCoolingFinsTemp: '',
        scrCoolingFan: '',
        panelExhaustFan: '',
        mccForcedCoolingFanTemp: '',
        rdi68: '',
        rdi69: '',
        rdi70: ''
      },
      {
        transformerNo: 'TF2',
        mccbIcRPhase: '',
        mccbIcBPhase: '',
        mccbCOg1: '',
        mccbCOg2: '',
        mccbBodyTemp: '',
        kvMa: '',
        spMin: '',
        scrCoolingFinsTemp: '',
        scrCoolingFan: '',
        panelExhaustFan: '',
        mccForcedCoolingFanTemp: '',
        rdi68: '',
        rdi69: '',
        rdi70: ''
      },
      {
        transformerNo: 'TF3',
        mccbIcRPhase: '',
        mccbIcBPhase: '',
        mccbCOg1: '',
        mccbCOg2: '',
        mccbBodyTemp: '',
        kvMa: '',
        spMin: '',
        scrCoolingFinsTemp: '',
        scrCoolingFan: '',
        panelExhaustFan: '',
        mccForcedCoolingFanTemp: '',
        rdi68: '',
        rdi69: '',
        rdi70: ''
      }
    ]
  })

  useEffect(() => {
    fetchSessions()
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment')
      if (response.ok) {
        const data = await response.json()
        setEquipment(data)
      }
    } catch (error) {
      console.error('Error fetching equipment:', error)
      // Set mock ESP equipment if API fails
      setEquipment([
        {
          id: 1,
          tagNo: 'ESP-01',
          equipmentName: 'ESP MCC Panel 1',
          equipmentType: 'ESP - MCC Panel',
          location: 'Main Plant'
        },
        {
          id: 2,
          tagNo: 'ESP-02',
          equipmentName: 'ESP MCC Panel 2',
          equipmentType: 'ESP - MCC Panel',
          location: 'Main Plant'
        },
        {
          id: 3,
          tagNo: 'ESP-03',
          equipmentName: 'ESP MCC Panel 3',
          equipmentType: 'ESP - MCC Panel',
          location: 'Secondary Plant'
        }
      ])
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/esp-sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching ESP sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        espCode: formData.espCode,
        inspectionDate: formData.inspectionDate?.toISOString(),
        month: Number(formData.month),
        doneBy: formData.doneBy || undefined,
        transformers: formData.transformers,
        remarks: formData.remarks || undefined
      }

      let response
      if (editingSession) {
        // Update existing session
        response = await fetch(`/api/esp-sessions/${editingSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        // Create new session
        response = await fetch('/api/esp-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (response.ok) {
        const result = await response.json()
        await fetchSessions()
        await fetchEquipment() // Refresh equipment list in case new equipment was created
        setShowForm(false)
        setEditingSession(null)
        resetForm()
        
        // Check if this was a new ESP code that wasn't in equipment list
        const espExistedBefore = equipment.some(eq => eq.tagNo === formData.espCode)
        
        toast({
          title: "Success",
          description: editingSession 
            ? "ESP thermography session updated successfully!" 
            : `ESP thermography session saved successfully!${!espExistedBefore ? ` New equipment ${formData.espCode} added to equipment master.` : ''}`,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: `Error ${editingSession ? 'updating' : 'saving'} ESP session. Please try again.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: `Error ${editingSession ? 'updating' : 'saving'} ESP session. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      espCode: '',
      equipmentName: '',
      equipmentType: '',
      inspectionDate: undefined,
      month: '',
      doneBy: '',
      remarks: '',
      transformers: [
        {
          transformerNo: 'TF1',
          mccbIcRPhase: '',
          mccbIcBPhase: '',
          mccbCOg1: '',
          mccbCOg2: '',
          mccbBodyTemp: '',
          kvMa: '',
          spMin: '',
          scrCoolingFinsTemp: '',
          scrCoolingFan: '',
          panelExhaustFan: '',
          mccForcedCoolingFanTemp: '',
          rdi68: '',
          rdi69: '',
          rdi70: ''
        },
        {
          transformerNo: 'TF2',
          mccbIcRPhase: '',
          mccbIcBPhase: '',
          mccbCOg1: '',
          mccbCOg2: '',
          mccbBodyTemp: '',
          kvMa: '',
          spMin: '',
          scrCoolingFinsTemp: '',
          scrCoolingFan: '',
          panelExhaustFan: '',
          mccForcedCoolingFanTemp: '',
          rdi68: '',
          rdi69: '',
          rdi70: ''
        },
        {
          transformerNo: 'TF3',
          mccbIcRPhase: '',
          mccbIcBPhase: '',
          mccbCOg1: '',
          mccbCOg2: '',
          mccbBodyTemp: '',
          kvMa: '',
          spMin: '',
          scrCoolingFinsTemp: '',
          scrCoolingFan: '',
          panelExhaustFan: '',
          mccForcedCoolingFanTemp: '',
          rdi68: '',
          rdi69: '',
          rdi70: ''
        }
      ]
    })
    setEditingSession(null)
  }

  // Filtering logic
  const hasActiveFilters = selectedEsp !== 'all' || selectedMonth !== 'all' || searchTerm
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = !searchTerm || 
      session.espCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.doneBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEsp = selectedEsp === 'all' || session.espCode === selectedEsp
    const matchesMonth = selectedMonth === 'all' || session.month.toString() === selectedMonth
    
    return matchesSearch && matchesEsp && matchesMonth
  })

  const toggleSessionExpansion = (sessionId: number) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const getTemperatureStatus = (temp: number) => {
    if (temp > 80) return { label: 'Critical', class: 'bg-red-100 text-red-800' }
    if (temp > 60) return { label: 'Warning', class: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Normal', class: 'bg-green-100 text-green-800' }
  }

  const getCompletedTransformersCount = (session: EspSession): number => {
    return session.transformerRecords.filter(record => {
      // Check if transformer has at least one meaningful measurement
      return (
        (record.mccbIcRPhase && record.mccbIcRPhase > 0) ||
        (record.mccbIcBPhase && record.mccbIcBPhase > 0) ||
        (record.mccbCOg1 && record.mccbCOg1 > 0) ||
        (record.mccbCOg2 && record.mccbCOg2 > 0) ||
        (record.mccbBodyTemp && record.mccbBodyTemp > 0) ||
        (record.scrCoolingFinsTemp && record.scrCoolingFinsTemp > 0) ||
        (record.rdi68 && record.rdi68 > 0) ||
        (record.rdi69 && record.rdi69 > 0) ||
        (record.rdi70 && record.rdi70 > 0)
      )
    }).length
  }

  const downloadExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      
      const exportData = filteredSessions.flatMap(session => 
        session.transformerRecords.map(record => ({
          'ESP Code': session.espCode,
          'Transformer': record.transformerNo,
          'Step': record.step,
          'Month': months.find(m => m.value === session.month)?.label || session.month,
          'Inspection Date': format(new Date(session.inspectionDate), 'dd/MM/yyyy'),
          'MCCB R-Phase': record.mccbIcRPhase || '',
          'MCCB B-Phase': record.mccbIcBPhase || '',
          'MCCB C O/G-1': record.mccbCOg1 || '',
          'MCCB C O/G-2': record.mccbCOg2 || '',
          'MCCB Body Temperature': record.mccbBodyTemp || '',
          'SCR Cooling Fins Temperature': record.scrCoolingFinsTemp || '',
          'RDI-68': record.rdi68 || '',
          'RDI-69': record.rdi69 || '',
          'RDI-70': record.rdi70 || '',
          'Done By': session.doneBy || '',
          'Remarks': session.remarks || '',
          'Status': session.isCompleted ? 'Completed' : 'In Progress',
          'Created Date': format(new Date(session.createdAt), 'dd/MM/yyyy HH:mm')
        }))
      )

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ESP Thermography Sessions')
      
      const fileName = `ESP_Thermography_Sessions_${format(new Date(), 'dd-MM-yyyy')}.xlsx`
      XLSX.writeFile(workbook, fileName)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Error exporting data to Excel')
    }
  }

  const updateTransformerField = (transformerIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      transformers: prev.transformers.map((transformer, index) => 
        index === transformerIndex 
          ? { ...transformer, [field]: value }
          : transformer
      )
    }))
  }

  const handleEspCodeChange = (espCode: string) => {
    setFormData(prev => ({ ...prev, espCode }))
    
    // Find matching equipment and auto-fill equipment name and type
    const foundEquipment = equipment.find(eq => eq.tagNo === espCode)
    if (foundEquipment) {
      setFormData(prev => ({
        ...prev,
        espCode,
        equipmentName: foundEquipment.equipmentName,
        equipmentType: foundEquipment.equipmentType
      }))
    }
  }

  const handleQRScan = (data: string) => {
    console.log("QR Scanned:", data)
    
    try {
      // Try to parse as JSON first (equipment QR code)
      const parsed = JSON.parse(data)
      if (parsed.type === "equipment" && parsed.tagNo) {
        // Check if it's ESP equipment
        const foundEquipment = equipment.find(e => e.tagNo === parsed.tagNo)
        if (foundEquipment && foundEquipment.equipmentType.includes('ESP')) {
          handleEspCodeChange(parsed.tagNo)
          setShowForm(true) // Open form when QR is scanned
          toast({
            title: "ESP Equipment Scanned",
            description: `Loaded ${parsed.tagNo} - ${foundEquipment.equipmentName}`,
          })
        } else {
          toast({
            title: "Invalid Equipment",
            description: "This QR code is not for ESP equipment.",
            variant: "destructive"
          })
        }
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
            (e.id.toString() === pathParts[tagIndex] || e.tagNo === pathParts[tagIndex]) &&
            e.equipmentType.includes('ESP')
          )
          if (foundEquipment) {
            handleEspCodeChange(foundEquipment.tagNo)
            setShowForm(true) // Open form when QR is scanned
            toast({
              title: "ESP Equipment Scanned",
              description: `Loaded ${foundEquipment.tagNo} - ${foundEquipment.equipmentName}`,
            })
          } else {
            toast({
              title: "Invalid Equipment",
              description: "This QR code is not for ESP equipment.",
              variant: "destructive"
            })
          }
        }
      }
    } catch {
      // Try direct tag number match
      const foundEquipment = equipment.find(e => e.tagNo === data && e.equipmentType.includes('ESP'))
      if (foundEquipment) {
        handleEspCodeChange(foundEquipment.tagNo)
        setShowForm(true) // Open form when QR is scanned
        toast({
          title: "ESP Equipment Scanned",
          description: `Loaded ${foundEquipment.tagNo} - ${foundEquipment.equipmentName}`,
        })
      } else {
        toast({
          title: "Equipment Not Found",
          description: "No ESP equipment found with this QR code.",
          variant: "destructive"
        })
      }
    }
  }

  const handleEditSession = (session: EspSession) => {
    setEditingSession(session)
    
    // Populate form with existing session data
    setFormData({
      espCode: session.espCode,
      equipmentName: '', // Will be auto-filled by handleEspCodeChange
      equipmentType: '', // Will be auto-filled by handleEspCodeChange
      inspectionDate: new Date(session.inspectionDate),
      month: session.month.toString(),
      doneBy: session.doneBy || '',
      remarks: session.remarks || '',
      transformers: session.transformerRecords.length > 0 
        ? session.transformerRecords.map(record => ({
            transformerNo: record.transformerNo,
            mccbIcRPhase: record.mccbIcRPhase?.toString() || '',
            mccbIcBPhase: record.mccbIcBPhase?.toString() || '',
            mccbCOg1: record.mccbCOg1?.toString() || '',
            mccbCOg2: record.mccbCOg2?.toString() || '',
            mccbBodyTemp: record.mccbBodyTemp?.toString() || '',
            kvMa: record.kvMa || '',
            spMin: record.spMin || '',
            scrCoolingFinsTemp: record.scrCoolingFinsTemp?.toString() || '',
            scrCoolingFan: record.scrCoolingFan || '',
            panelExhaustFan: record.panelExhaustFan || '',
            mccForcedCoolingFanTemp: record.mccForcedCoolingFanTemp || '',
            rdi68: record.rdi68?.toString() || '',
            rdi69: record.rdi69?.toString() || '',
            rdi70: record.rdi70?.toString() || ''
          }))
        : formData.transformers
    })
    
    // Auto-fill equipment data
    handleEspCodeChange(session.espCode)
    
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingSession(null)
    setShowForm(false)
    resetForm()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Thermometer className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p>Loading ESP thermography sessions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Thermometer className="h-8 w-8 text-orange-500" />
            ESP MCC Thermography
          </h1>
          <p className="text-muted-foreground mt-1">
            Step-by-step temperature monitoring for ESP transformers (TF1, TF2, TF3)
          </p>
        </div>
        <div className="flex gap-2">
          <QRScanner onScan={handleQRScan} />
          <Button onClick={downloadExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New ESP Session
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {editingSession ? 'Edit ESP Thermography Session' : 'New ESP Thermography Session'}
            </CardTitle>
            <CardDescription>
              {editingSession 
                ? `Editing session for ${editingSession.espCode} - Complete or update temperature measurements`
                : 'Record temperature measurements for all transformers (TF1, TF2, TF3) in one session'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="espCode">ESP Code / Tag No</Label>
                  <Combobox
                    options={equipment.map((eq) => ({
                      value: eq.tagNo,
                      label: `${eq.tagNo} - ${eq.equipmentName}`,
                    }))}
                    value={formData.espCode}
                    onValueChange={handleEspCodeChange}
                    placeholder="Select or add ESP Code (e.g., ESP-01)"
                    searchPlaceholder="Search ESP Code..."
                    allowCustom={true}
                    onAddNew={(newEspCode) => {
                      const newEquipment = {
                        id: Date.now(),
                        tagNo: newEspCode,
                        equipmentName: `New ESP Equipment - ${newEspCode}`,
                        equipmentType: "ESP - MCC Panel",
                        location: null,
                      }
                      setEquipment((prev) => [...prev, newEquipment])
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="equipmentName">Equipment Name</Label>
                  <Input
                    id="equipmentName"
                    value={formData.equipmentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, equipmentName: e.target.value }))}
                    placeholder="e.g., ESP MCC Panel 1"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="equipmentType">Equipment Type</Label>
                  <Select 
                    value={formData.equipmentType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, equipmentType: value }))}
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
              </div>

              {/* Inspection Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="month">Month</Label>
                  <Select 
                    value={formData.month} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, month: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="inspectionDate">Inspection Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.inspectionDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.inspectionDate ? (
                          format(formData.inspectionDate, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.inspectionDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, inspectionDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="doneBy">Inspector</Label>
                  <Input
                    id="doneBy"
                    value={formData.doneBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, doneBy: e.target.value }))}
                    placeholder="Inspector name"
                  />
                </div>
              </div>

              {/* Transformers Measurements */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Transformer Measurements</h3>
                
                {formData.transformers.map((transformer, transformerIndex) => (
                  <Card key={transformer.transformerNo} className="p-4">
                    <h4 className="text-md font-medium mb-4 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {transformer.transformerNo} - Step {transformerIndex + 1}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* MCCB Measurements */}
                      <div>
                        <Label>MCCB R-Phase (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.mccbIcRPhase}
                          onChange={(e) => updateTransformerField(transformerIndex, 'mccbIcRPhase', e.target.value)}
                          placeholder="Temperature"
                        />
                      </div>
                      
                      <div>
                        <Label>MCCB B-Phase (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.mccbIcBPhase}
                          onChange={(e) => updateTransformerField(transformerIndex, 'mccbIcBPhase', e.target.value)}
                          placeholder="Temperature"
                        />
                      </div>
                      
                      <div>
                        <Label>MCCB C O/G-1 (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.mccbCOg1}
                          onChange={(e) => updateTransformerField(transformerIndex, 'mccbCOg1', e.target.value)}
                          placeholder="Temperature"
                        />
                      </div>
                      
                      <div>
                        <Label>MCCB C O/G-2 (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.mccbCOg2}
                          onChange={(e) => updateTransformerField(transformerIndex, 'mccbCOg2', e.target.value)}
                          placeholder="Temperature"
                        />
                      </div>
                      
                      <div>
                        <Label>MCCB Body (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.mccbBodyTemp}
                          onChange={(e) => updateTransformerField(transformerIndex, 'mccbBodyTemp', e.target.value)}
                          placeholder="Temperature"
                        />
                      </div>
                      
                      <div>
                        <Label>SCR Cooling Fins (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.scrCoolingFinsTemp}
                          onChange={(e) => updateTransformerField(transformerIndex, 'scrCoolingFinsTemp', e.target.value)}
                          placeholder="Temperature"
                        />
                      </div>
                      
                      <div>
                        <Label>RDI-68 (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.rdi68}
                          onChange={(e) => updateTransformerField(transformerIndex, 'rdi68', e.target.value)}
                          placeholder="Temperature"
                        />
                      </div>
                      
                      <div>
                        <Label>RDI-69 (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.rdi69}
                          onChange={(e) => updateTransformerField(transformerIndex, 'rdi69', e.target.value)}
                          placeholder="Temperature"
                        />
                      </div>
                      
                      <div>
                        <Label>RDI-70 (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.rdi70}
                          onChange={(e) => updateTransformerField(transformerIndex, 'rdi70', e.target.value)}
                          placeholder="Temperature"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Remarks */}
              <div>
                <Label htmlFor="remarks">Session Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Overall session notes and observations..."
                  rows={3}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSession ? 'Update ESP Session' : 'Save ESP Session'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search ESP code, inspector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="esp">ESP Code</Label>
              <Select value={selectedEsp} onValueChange={setSelectedEsp}>
                <SelectTrigger>
                  <SelectValue placeholder="All ESP Codes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ESP Codes</SelectItem>
                  {espCodes.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedEsp('all')
                  setSelectedMonth('all')
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>ESP Thermography Sessions ({filteredSessions.length})</CardTitle>
          <CardDescription>
            Step-by-step temperature monitoring sessions for ESP transformers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8">
                <Thermometer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No ESP sessions found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters 
                    ? 'Try adjusting your filters' 
                    : 'Add your first ESP thermography session'
                  }
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <Collapsible>
                    <CollapsibleTrigger 
                      className="flex items-center justify-between w-full hover:bg-muted/50 p-2 rounded"
                      onClick={() => toggleSessionExpansion(session.id)}
                    >
                      <div className="flex items-center gap-4">
                        {expandedSessions.has(session.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div className="text-left">
                          <div className="font-medium">{session.espCode}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(session.inspectionDate), 'dd/MM/yyyy')} • 
                            {months.find(m => m.value === session.month)?.label}
                          </div>
                        </div>
                        <Badge variant={session.isCompleted ? "default" : "secondary"}>
                          {session.isCompleted ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed ({getCompletedTransformersCount(session)}/3)
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              In Progress ({getCompletedTransformersCount(session)}/3)
                            </>
                          )}
                        </Badge>
                        {session.doneBy && (
                          <div className="text-sm text-muted-foreground">
                            By: {session.doneBy}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!session.isCompleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditSession(session)
                            }}
                            className="text-xs"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-4">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Transformer</TableHead>
                              <TableHead>Step</TableHead>
                              <TableHead>MCCB R-Phase</TableHead>
                              <TableHead>MCCB B-Phase</TableHead>
                              <TableHead>MCCB C O/G-1</TableHead>
                              <TableHead>MCCB C O/G-2</TableHead>
                              <TableHead>MCCB Body</TableHead>
                              <TableHead>SCR Fins</TableHead>
                              <TableHead>RDI-68</TableHead>
                              <TableHead>RDI-69</TableHead>
                              <TableHead>RDI-70</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {session.transformerRecords.map((record) => {
                              const maxTemp = Math.max(
                                record.mccbIcRPhase || 0,
                                record.mccbIcBPhase || 0,
                                record.mccbCOg1 || 0,
                                record.mccbCOg2 || 0,
                                record.mccbBodyTemp || 0,
                                record.scrCoolingFinsTemp || 0,
                                record.rdi68 || 0,
                                record.rdi69 || 0,
                                record.rdi70 || 0
                              )
                              const status = getTemperatureStatus(maxTemp)
                              
                              return (
                                <TableRow key={record.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Zap className="h-4 w-4" />
                                      <span className="font-medium">{record.transformerNo}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      Step {record.step}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{record.mccbIcRPhase ? `${record.mccbIcRPhase}°C` : '-'}</TableCell>
                                  <TableCell>{record.mccbIcBPhase ? `${record.mccbIcBPhase}°C` : '-'}</TableCell>
                                  <TableCell>{record.mccbCOg1 ? `${record.mccbCOg1}°C` : '-'}</TableCell>
                                  <TableCell>{record.mccbCOg2 ? `${record.mccbCOg2}°C` : '-'}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {record.mccbBodyTemp ? `${record.mccbBodyTemp}°C` : '-'}
                                      <Badge className={status.class}>
                                        {status.label}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell>{record.scrCoolingFinsTemp ? `${record.scrCoolingFinsTemp}°C` : '-'}</TableCell>
                                  <TableCell>{record.rdi68 ? `${record.rdi68}°C` : '-'}</TableCell>
                                  <TableCell>{record.rdi69 ? `${record.rdi69}°C` : '-'}</TableCell>
                                  <TableCell>{record.rdi70 ? `${record.rdi70}°C` : '-'}</TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {session.remarks && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            <strong>Session Remarks:</strong> {session.remarks}
                          </p>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
