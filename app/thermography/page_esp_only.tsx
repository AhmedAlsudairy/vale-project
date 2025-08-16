'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CalendarIcon, Download, Plus, Search, Thermometer, Zap, ChevronRight, ChevronDown, CheckCircle, Clock, Eye, User, Edit2, ChevronUp, BarChart3, ChevronLeft } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Combobox } from '@/components/ui/combobox'
import { useToast } from '@/components/ui/use-toast'
import * as XLSX from 'xlsx'
import { QRScanner } from '@/components/qr-scanner'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

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
  rdi68?: string
  rdi69?: string
  rdi70?: string
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
  'ESP - Control Panel',
  'ESP - Field Section',
  'ESP - Hopper',
]

export default function ThermographyPage() {
  const { toast } = useToast()
  
  const [sessions, setSessions] = useState<EspSession[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState<EspSession | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEsp, setSelectedEsp] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTempStatus, setSelectedTempStatus] = useState('all')
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [currentInstructionImage, setCurrentInstructionImage] = useState(0)
  const [showInstructionModal, setShowInstructionModal] = useState(false)

  // ESP instruction images
  const espInstructionImages = [
    '/esp/1.png',
    '/esp/2.png', 
    '/esp/3.png',
    '/esp/4.png',
    '/esp/5.png',
    '/esp/6.png'
  ]

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

  // Navigation handlers
  const nextInstructionImage = () => {
    setCurrentInstructionImage(prev => 
      prev === espInstructionImages.length - 1 ? 0 : prev + 1
    )
  }

  const prevInstructionImage = () => {
    setCurrentInstructionImage(prev => 
      prev === 0 ? espInstructionImages.length - 1 : prev - 1
    )
  }

  // Auto-advance instruction images
  useEffect(() => {
    if (!showInstructionModal) return
    
    const interval = setInterval(nextInstructionImage, 5000)
    return () => clearInterval(interval)
  }, [showInstructionModal, espInstructionImages.length])

  // Initialize data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchEquipment(),
          fetchSessions()
        ])
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment')
      const data = await response.json()
      setEquipment(data)
    } catch (error) {
      console.error('Error fetching equipment:', error)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/esp-sessions')
      const data = await response.json()
      setSessions(data)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    try {
      setIsSubmitting(true)
      
      const sessionData = {
        espCode: formData.espCode,
        equipmentName: formData.equipmentName,
        equipmentType: formData.equipmentType,
        inspectionDate: formData.inspectionDate?.toISOString(),
        month: parseInt(formData.month),
        doneBy: formData.doneBy,
        remarks: formData.remarks,
        transformerRecords: formData.transformers.map(t => ({
          ...t,
          mccbIcRPhase: t.mccbIcRPhase ? parseFloat(t.mccbIcRPhase) : undefined,
          mccbIcBPhase: t.mccbIcBPhase ? parseFloat(t.mccbIcBPhase) : undefined,
          mccbCOg1: t.mccbCOg1 ? parseFloat(t.mccbCOg1) : undefined,
          mccbCOg2: t.mccbCOg2 ? parseFloat(t.mccbCOg2) : undefined,
          mccbBodyTemp: t.mccbBodyTemp ? parseFloat(t.mccbBodyTemp) : undefined,
          scrCoolingFinsTemp: t.scrCoolingFinsTemp ? parseFloat(t.scrCoolingFinsTemp) : undefined,
          mccForcedCoolingFanTemp: t.mccForcedCoolingFanTemp ? parseFloat(t.mccForcedCoolingFanTemp) : undefined
        }))
      }
      
      if (editingSession) {
        const response = await fetch(`/api/esp-sessions/${editingSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        })
        if (!response.ok) throw new Error('Failed to update session')
      } else {
        const response = await fetch('/api/esp-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        })
        if (!response.ok) throw new Error('Failed to create session')
      }
      
      toast({
        title: "Success",
        description: editingSession ? "ESP session updated successfully" : "ESP session created successfully",
      })
      
      setShowForm(false)
      setEditingSession(null)
      resetForm()
      await fetchSessions()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save ESP session",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
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
          mccbIcRPhase: '', mccbIcBPhase: '', mccbCOg1: '', mccbCOg2: '', mccbBodyTemp: '',
          kvMa: '', spMin: '', scrCoolingFinsTemp: '', scrCoolingFan: '', panelExhaustFan: '',
          mccForcedCoolingFanTemp: '', rdi68: '', rdi69: '', rdi70: ''
        },
        {
          transformerNo: 'TF2',
          mccbIcRPhase: '', mccbIcBPhase: '', mccbCOg1: '', mccbCOg2: '', mccbBodyTemp: '',
          kvMa: '', spMin: '', scrCoolingFinsTemp: '', scrCoolingFan: '', panelExhaustFan: '',
          mccForcedCoolingFanTemp: '', rdi68: '', rdi69: '', rdi70: ''
        },
        {
          transformerNo: 'TF3',
          mccbIcRPhase: '', mccbIcBPhase: '', mccbCOg1: '', mccbCOg2: '', mccbBodyTemp: '',
          kvMa: '', spMin: '', scrCoolingFinsTemp: '', scrCoolingFan: '', panelExhaustFan: '',
          mccForcedCoolingFanTemp: '', rdi68: '', rdi69: '', rdi70: ''
        }
      ]
    })
  }

  const handleEditSession = (session: EspSession) => {
    setEditingSession(session)
    setFormData({
      espCode: session.espCode,
      equipmentName: '',
      equipmentType: '',
      inspectionDate: new Date(session.inspectionDate),
      month: session.month.toString(),
      doneBy: session.doneBy || '',
      remarks: session.remarks || '',
      transformers: session.transformerRecords.map(record => ({
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
        rdi68: record.rdi68 || '',
        rdi69: record.rdi69 || '',
        rdi70: record.rdi70 || ''
      }))
    })
    setShowForm(true)
  }

  const updateTransformer = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      transformers: prev.transformers.map((t, i) => 
        i === index ? { ...t, [field]: value } : t
      )
    }))
  }

  const handleQRScan = (data: string) => {
    // Process QR code data
    setFormData(prev => ({ ...prev, espCode: data }))
  }

  const toggleSessionExpansion = (sessionId: number) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const getTemperatureStatus = (temp: number) => {
    if (temp <= 60) return { label: 'Normal', class: 'bg-green-100 text-green-800' }
    if (temp <= 80) return { label: 'Warning', class: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Critical', class: 'bg-red-100 text-red-800' }
  }

  const getCompletedTransformersCount = (session: EspSession) => {
    return session.transformerRecords.filter(record => 
      record.mccbIcRPhase && record.mccbIcBPhase && record.mccbBodyTemp
    ).length
  }

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (searchTerm && !session.espCode.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !session.doneBy?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (selectedEsp !== 'all' && session.espCode !== selectedEsp) return false
    if (selectedMonth !== 'all' && session.month !== parseInt(selectedMonth)) return false
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'completed' && !session.isCompleted) return false
      if (selectedStatus === 'in-progress' && session.isCompleted) return false
    }
    if (selectedTempStatus !== 'all') {
      const hasTemp = session.transformerRecords.some(record => {
        const maxTemp = Math.max(
          record.mccbIcRPhase || 0,
          record.mccbIcBPhase || 0,
          record.mccbBodyTemp || 0,
          record.scrCoolingFinsTemp || 0
        )
        if (selectedTempStatus === 'critical') return maxTemp > 80
        if (selectedTempStatus === 'warning') return maxTemp > 60 && maxTemp <= 80
        if (selectedTempStatus === 'normal') return maxTemp <= 60
        return false
      })
      if (!hasTemp) return false
    }
    return true
  })

  const hasActiveFilters = searchTerm || selectedEsp !== 'all' || selectedMonth !== 'all' || 
                         selectedStatus !== 'all' || selectedTempStatus !== 'all'

  const downloadExcel = (session?: EspSession) => {
    const sessionsToExport = session ? [session] : filteredSessions
    
    if (sessionsToExport.length === 0) {
      toast({
        title: "No Data",
        description: "No sessions available to export",
        variant: "destructive"
      })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(
      sessionsToExport.flatMap(s => 
        s.transformerRecords.map(record => ({
          'ESP Code': s.espCode,
          'Inspection Date': format(new Date(s.inspectionDate), 'dd/MM/yyyy'),
          'Month': months.find(m => m.value === s.month)?.label,
          'Inspector': s.doneBy || '',
          'Transformer': record.transformerNo,
          'Step': record.step,
          'MCCB IC R-Phase (°C)': record.mccbIcRPhase || '',
          'MCCB IC B-Phase (°C)': record.mccbIcBPhase || '',
          'MCCB C O/G-1 (°C)': record.mccbCOg1 || '',
          'MCCB C O/G-2 (°C)': record.mccbCOg2 || '',
          'MCCB Body Temp (°C)': record.mccbBodyTemp || '',
          'kV/mA': record.kvMa || '',
          'SP/min': record.spMin || '',
          'SCR Cooling Fins Temp (°C)': record.scrCoolingFinsTemp || '',
          'SCR Cooling Fan': record.scrCoolingFan || '',
          'Panel Exhaust Fan': record.panelExhaustFan || '',
          'MCC Forced Cooling Fan Temp': record.mccForcedCoolingFanTemp || '',
          'RDI-68 Relay': record.rdi68 || '',
          'RDI-69 Relay': record.rdi69 || '',
          'RDI-70 Relay': record.rdi70 || '',
          'Remarks': s.remarks || ''
        }))
      )
    )
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ESP Thermography')
    
    const filename = session 
      ? `ESP_${session.espCode}_Thermography_${format(new Date(), 'yyyyMMdd')}.xlsx`
      : `ESP_Thermography_Export_${format(new Date(), 'yyyyMMdd')}.xlsx`
    
    XLSX.writeFile(workbook, filename)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Thermometer className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              <span className="truncate">ESP Thermography Management</span>
            </h1>
          </div>
          <div>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Temperature monitoring for ESP transformers
            </p>
          </div>
        </div>
        
        {/* Action Buttons - Mobile Optimized */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="w-full sm:w-auto">
            <QRScanner onScan={handleQRScan} />
          </div>
          <Button onClick={() => downloadExcel()} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Export </span>Excel
          </Button>
          <Button 
            onClick={() => setShowForm(true)} 
            size="sm" 
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">New </span>
            ESP Session
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <>
          {/* ESP Instructions Carousel */}
          <Card className="mb-4 sm:mb-6 border-2 border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30">
            <CardHeader className="pb-3 bg-blue-100 dark:bg-blue-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                ESP Thermography Instructions
              </CardTitle>
              <CardDescription>
                Follow these step-by-step instructions for proper temperature measurement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Current instruction image */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={espInstructionImages[currentInstructionImage]}
                    alt={`ESP Instruction ${currentInstructionImage + 1}`}
                    fill
                    className="object-contain"
                    priority
                  />
                  
                  {/* Navigation overlay */}
                  <div className="absolute inset-0 flex items-center justify-between p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevInstructionImage}
                      className="bg-black/50 text-white hover:bg-black/70 rounded-full"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextInstructionImage}
                      className="bg-black/50 text-white hover:bg-black/70 rounded-full"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentInstructionImage + 1} / {espInstructionImages.length}
                  </div>
                </div>
                
                {/* Thumbnail navigation */}
                <div className="space-y-3">
                  <div className="text-sm font-medium">Quick Navigation:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {espInstructionImages.map((imageSrc, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentInstructionImage(index)}
                        className={`relative aspect-video rounded border-2 transition-all hover:scale-105 ${
                          currentInstructionImage === index
                            ? 'border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-600'
                            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                        }`}
                      >
                        <Image
                          src={imageSrc}
                          alt={`Instruction ${index + 1}`}
                          fill
                          className="object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                          <span className="text-xs font-semibold text-white bg-black/70 px-2 py-1 rounded">
                            {index + 1}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowInstructionModal(true)}
                      className="text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Full Screen View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {editingSession ? 'Edit ESP Session' : 'New ESP Thermography Session'}
              </CardTitle>
              <CardDescription>
                Enter temperature measurements for ESP transformer components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="espCode">ESP Code *</Label>
                    <Combobox
                      value={formData.espCode}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, espCode: value }))}
                      options={espCodes.map(code => ({ value: code, label: code }))}
                      placeholder="Select or type ESP code"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="month">Month *</Label>
                    <Select value={formData.month} onValueChange={(value) => setFormData(prev => ({ ...prev, month: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
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
                    <Label>Inspection Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.inspectionDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.inspectionDate ? format(formData.inspectionDate, "PPP") : "Select date"}
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

                <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Session remarks..."
                  />
                </div>

                {/* Transformer Records */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Transformer Temperature Readings</h3>
                  {formData.transformers.map((transformer, index) => (
                    <Card key={index} className="p-4">
                      <CardHeader className="p-0 pb-4">
                        <CardTitle className="text-base">{transformer.transformerNo}</CardTitle>
                      </CardHeader>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label>MCCB IC R-Phase (°C)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={transformer.mccbIcRPhase}
                            onChange={(e) => updateTransformer(index, 'mccbIcRPhase', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>MCCB IC B-Phase (°C)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={transformer.mccbIcBPhase}
                            onChange={(e) => updateTransformer(index, 'mccbIcBPhase', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>MCCB C O/G-1 (°C)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={transformer.mccbCOg1}
                            onChange={(e) => updateTransformer(index, 'mccbCOg1', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>MCCB C O/G-2 (°C)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={transformer.mccbCOg2}
                            onChange={(e) => updateTransformer(index, 'mccbCOg2', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>MCCB Body Temp (°C)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={transformer.mccbBodyTemp}
                            onChange={(e) => updateTransformer(index, 'mccbBodyTemp', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>SCR Cooling Fins Temp (°C)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={transformer.scrCoolingFinsTemp}
                            onChange={(e) => updateTransformer(index, 'scrCoolingFinsTemp', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>kV/mA</Label>
                          <Input
                            value={transformer.kvMa}
                            onChange={(e) => updateTransformer(index, 'kvMa', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>SP/min</Label>
                          <Input
                            value={transformer.spMin}
                            onChange={(e) => updateTransformer(index, 'spMin', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>SCR Cooling Fan</Label>
                          <Input
                            value={transformer.scrCoolingFan}
                            onChange={(e) => updateTransformer(index, 'scrCoolingFan', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Panel Exhaust Fan</Label>
                          <Input
                            value={transformer.panelExhaustFan}
                            onChange={(e) => updateTransformer(index, 'panelExhaustFan', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>MCC Forced Cooling Fan Temp</Label>
                          <Input
                            value={transformer.mccForcedCoolingFanTemp}
                            onChange={(e) => updateTransformer(index, 'mccForcedCoolingFanTemp', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>RDI-68 Relay</Label>
                          <Input
                            value={transformer.rdi68}
                            onChange={(e) => updateTransformer(index, 'rdi68', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>RDI-69 Relay</Label>
                          <Input
                            value={transformer.rdi69}
                            onChange={(e) => updateTransformer(index, 'rdi69', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>RDI-70 Relay</Label>
                          <Input
                            value={transformer.rdi70}
                            onChange={(e) => updateTransformer(index, 'rdi70', e.target.value)}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Form Actions */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingSession(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingSession ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingSession ? 'Update Session' : 'Create Session'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <Label htmlFor="search" className="text-xs sm:text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search ESP code, inspector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 text-xs sm:text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="esp" className="text-xs sm:text-sm font-medium">ESP Code</Label>
              <Select value={selectedEsp} onValueChange={setSelectedEsp}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="All ESP Codes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All ESP Codes</SelectItem>
                  {espCodes.map(code => (
                    <SelectItem key={code} value={code} className="text-xs sm:text-sm">{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month" className="text-xs sm:text-sm font-medium">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Months</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()} className="text-xs sm:text-sm">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status" className="text-xs sm:text-sm font-medium">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Status</SelectItem>
                  <SelectItem value="completed" className="text-xs sm:text-sm">Completed</SelectItem>
                  <SelectItem value="in-progress" className="text-xs sm:text-sm">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tempStatus" className="text-xs sm:text-sm font-medium">Temperature</Label>
              <Select value={selectedTempStatus} onValueChange={setSelectedTempStatus}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="All Temps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Temperatures</SelectItem>
                  <SelectItem value="critical" className="text-xs sm:text-sm">Critical (&gt;80°C)</SelectItem>
                  <SelectItem value="warning" className="text-xs sm:text-sm">Warning (60-80°C)</SelectItem>
                  <SelectItem value="normal" className="text-xs sm:text-sm">Normal (≤60°C)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setSelectedEsp('all')
                setSelectedMonth('all')
                setSelectedStatus('all')
                setSelectedTempStatus('all')
              }}
              className="text-xs sm:text-sm h-9"
            >
              Clear All Filters
            </Button>
            {hasActiveFilters && (
              <div className="text-xs text-muted-foreground">
                {filteredSessions.length} of {sessions.length} sessions shown
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">ESP Thermography Sessions ({filteredSessions.length})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Step-by-step temperature monitoring sessions for ESP transformers
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 sm:space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Thermometer className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-xs sm:text-sm">No ESP sessions found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasActiveFilters 
                    ? 'Try adjusting your filters' 
                    : 'Add your first ESP thermography session'
                  }
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-2 sm:p-3">
                  <Collapsible>
                    <CollapsibleTrigger 
                      className="flex items-center justify-between w-full hover:bg-muted/50 p-2 rounded text-left"
                      onClick={() => toggleSessionExpansion(session.id)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {expandedSessions.has(session.id) ? (
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        )}
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm truncate">{session.espCode}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(session.inspectionDate), 'dd/MM/yyyy')} • 
                            {months.find(m => m.value === session.month)?.label}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={session.isCompleted ? "default" : "secondary"} className="text-xs px-1 sm:px-2">
                            {session.isCompleted ? (
                              <>
                                <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                <span className="hidden sm:inline">Complete</span>
                                <span className="sm:hidden">Done</span>
                                ({getCompletedTransformersCount(session)}/3)
                              </>
                            ) : (
                              <>
                                <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                <span className="hidden sm:inline">In Progress</span>
                                <span className="sm:hidden">Pending</span>
                                ({getCompletedTransformersCount(session)}/3)
                              </>
                            )}
                          </Badge>
                          {session.doneBy && (
                            <div className="text-xs text-muted-foreground hidden sm:block">
                              By: {session.doneBy}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadExcel(session)
                          }}
                          className="text-xs px-2 py-1 h-7"
                          title="Download Excel for this session"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        {!session.isCompleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditSession(session)
                            }}
                            className="text-xs px-2 py-1 h-7"
                          >
                            <span className="hidden sm:inline">Complete</span>
                            <span className="sm:hidden">Edit</span>
                          </Button>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-3 sm:mt-4">
                      {/* Mobile Card View - Hidden on Desktop */}
                      <div className="lg:hidden space-y-2 sm:space-y-3">
                        {session.transformerRecords.map((record) => {
                          const maxTemp = Math.max(
                            record.mccbIcRPhase || 0,
                            record.mccbIcBPhase || 0,
                            record.mccbCOg1 || 0,
                            record.mccbCOg2 || 0,
                            record.mccbBodyTemp || 0,
                            record.scrCoolingFinsTemp || 0
                          )
                          const status = getTemperatureStatus(maxTemp)
                          
                          return (
                            <Card key={record.id} className="p-3 dark:bg-gray-800/50">
                              <div className="flex items-center justify-between mb-2 sm:mb-3">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="font-medium text-sm">{record.transformerNo}</span>
                                  <Badge variant="outline" className="text-xs">Step {record.step}</Badge>
                                </div>
                                <Badge className={status.class + " text-xs"}>
                                  {status.label}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                <div>
                                  <span className="text-muted-foreground">MCCB R-Phase:</span>
                                  <div className="font-medium">{record.mccbIcRPhase ? `${record.mccbIcRPhase}°C` : '-'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">MCCB B-Phase:</span>
                                  <div className="font-medium">{record.mccbIcBPhase ? `${record.mccbIcBPhase}°C` : '-'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">MCCB C O/G-1:</span>
                                  <div className="font-medium">{record.mccbCOg1 ? `${record.mccbCOg1}°C` : '-'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">MCCB C O/G-2:</span>
                                  <div className="font-medium">{record.mccbCOg2 ? `${record.mccbCOg2}°C` : '-'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">MCCB Body:</span>
                                  <div className="font-medium">{record.mccbBodyTemp ? `${record.mccbBodyTemp}°C` : '-'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">SCR Fins:</span>
                                  <div className="font-medium">{record.scrCoolingFinsTemp ? `${record.scrCoolingFinsTemp}°C` : '-'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">RDI-68 Relay:</span>
                                  <div className="font-medium">{record.rdi68 || '-'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">RDI-69 Relay:</span>
                                  <div className="font-medium">{record.rdi69 || '-'}</div>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">RDI-70 Relay:</span>
                                  <div className="font-medium">{record.rdi70 || '-'}</div>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>

                      {/* Desktop Table View - Hidden on Mobile */}
                      <div className="hidden lg:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Transformer</TableHead>
                              <TableHead className="text-xs">Step</TableHead>
                              <TableHead className="text-xs">MCCB R-Phase</TableHead>
                              <TableHead className="text-xs">MCCB B-Phase</TableHead>
                              <TableHead className="text-xs">MCCB C O/G-1</TableHead>
                              <TableHead className="text-xs">MCCB C O/G-2</TableHead>
                              <TableHead className="text-xs">MCCB Body</TableHead>
                              <TableHead className="text-xs">SCR Fins</TableHead>
                              <TableHead className="text-xs">RDI-68 Relay</TableHead>
                              <TableHead className="text-xs">RDI-69 Relay</TableHead>
                              <TableHead className="text-xs">RDI-70 Relay</TableHead>
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
                                record.scrCoolingFinsTemp || 0
                              )
                              const status = getTemperatureStatus(maxTemp)
                              
                              return (
                                <TableRow key={record.id}>
                                  <TableCell className="text-xs">
                                    <div className="flex items-center gap-2">
                                      <Zap className="h-3 w-3" />
                                      <span className="font-medium">{record.transformerNo}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    <Badge variant="outline" className="text-xs">
                                      Step {record.step}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs">{record.mccbIcRPhase ? `${record.mccbIcRPhase}°C` : '-'}</TableCell>
                                  <TableCell className="text-xs">{record.mccbIcBPhase ? `${record.mccbIcBPhase}°C` : '-'}</TableCell>
                                  <TableCell className="text-xs">{record.mccbCOg1 ? `${record.mccbCOg1}°C` : '-'}</TableCell>
                                  <TableCell className="text-xs">{record.mccbCOg2 ? `${record.mccbCOg2}°C` : '-'}</TableCell>
                                  <TableCell className="text-xs">
                                    <div className="flex items-center gap-2">
                                      {record.mccbBodyTemp ? `${record.mccbBodyTemp}°C` : '-'}
                                      <Badge className={status.class + " text-xs"}>
                                        {status.label}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs">{record.scrCoolingFinsTemp ? `${record.scrCoolingFinsTemp}°C` : '-'}</TableCell>
                                  <TableCell className="text-xs">{record.rdi68 || '-'}</TableCell>
                                  <TableCell className="text-xs">{record.rdi69 || '-'}</TableCell>
                                  <TableCell className="text-xs">{record.rdi70 || '-'}</TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {session.remarks && (
                        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-muted dark:bg-gray-800/50 rounded-lg">
                          <p className="text-xs sm:text-sm">
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

      {/* ESP Instruction Modal */}
      <Dialog open={showInstructionModal} onOpenChange={setShowInstructionModal}>
        <DialogContent className="max-w-5xl w-full max-h-[95vh] p-0 dark:bg-gray-900">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 dark:text-gray-100">
              <Eye className="h-5 w-5" />
              ESP Instruction {currentInstructionImage + 1} of {espInstructionImages.length}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative px-6 pb-6">
            {/* Modal Carousel */}
            <Carousel className="w-full">
              <CarouselContent>
                {espInstructionImages.map((imageSrc, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      <Image
                        src={imageSrc}
                        alt={`ESP Instruction ${index + 1}`}
                        fill
                        className="object-contain"
                        priority={index === currentInstructionImage}
                        sizes="(max-width: 768px) 100vw, 80vw"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious 
                className="left-4 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700" 
                onClick={() => setCurrentInstructionImage(prev => 
                  prev === 0 ? espInstructionImages.length - 1 : prev - 1
                )}
              />
              <CarouselNext 
                className="right-4 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={() => setCurrentInstructionImage(prev => 
                  prev === espInstructionImages.length - 1 ? 0 : prev + 1
                )}
              />
            </Carousel>
            
            {/* Modal Thumbnail Navigation */}
            <div className="flex justify-center gap-3 mt-4 flex-wrap">
              {espInstructionImages.map((imageSrc, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentInstructionImage(index)}
                  className={`w-16 h-10 rounded border-2 transition-all hover:scale-110 ${
                    currentInstructionImage === index
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-600'
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  }`}
                >
                  <Image
                    src={imageSrc}
                    alt={`Instruction ${index + 1} thumbnail`}
                    width={64}
                    height={40}
                    className="w-full h-full object-cover rounded"
                  />
                </button>
              ))}
            </div>
            
            {/* Close Instructions */}
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Press ESC or click outside to close • Use arrow keys or buttons to navigate
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
