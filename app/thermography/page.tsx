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

interface LrsSession {
  id: number
  tagNumber: string
  equipmentName: string
  equipmentType: string
  inspector: string
  numberOfPoints: number
  date: string
  temperatureRecords: LrsTemperatureRecord[]
  previewImage?: string
}

interface LrsTemperatureRecord {
  id: number
  point: string
  description: string
  temperature: number
  status: 'Normal' | 'Warning' | 'Critical'
  inspector?: string
  createdAt?: string
  updatedAt?: string
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
  'LRS (Liquid Resistor Starter)',
  'LRS - Contactor',
  'LRS - Cooler Fan',
  'Motor - Induction Motor',
  'Motor - DC Motor',
  'Motor - Synchronous Motor',
  'Motor - Servo Motor',
  'Pump',
  'Fan',
  'Compressor',
  'Other'
]

export default function ThermographyPage() {
  const { toast } = useToast()
  
  const [sessions, setSessions] = useState<EspSession[]>([])
  const [lrsSessions, setLrsSessions] = useState<LrsSession[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLrsSubmitting, setIsLrsSubmitting] = useState(false)
  const [isRecordingSubmitting, setIsRecordingSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'esp' | 'lrs'>('esp')
  const [showForm, setShowForm] = useState(false)
  const [showLrsForm, setShowLrsForm] = useState(false)
  const [editingSession, setEditingSession] = useState<EspSession | null>(null)
  const [editingLrsSession, setEditingLrsSession] = useState<LrsSession | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEsp, setSelectedEsp] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTempStatus, setSelectedTempStatus] = useState('all')
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [currentInstructionImage, setCurrentInstructionImage] = useState(0)
  const [showInstructionModal, setShowInstructionModal] = useState(false)
  const [showLrsImageModal, setShowLrsImageModal] = useState(false)
  const [currentLrsImage, setCurrentLrsImage] = useState<string>('')
  const [recordingSessionId, setRecordingSessionId] = useState<number | null>(null)
  const [recordingData, setRecordingData] = useState<LrsTemperatureRecord[]>([])

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

  // LRS Form state
  const [lrsFormData, setLrsFormData] = useState({
    tagNumber: '',
    equipmentName: '',
    equipmentType: '',
    inspector: '',
    numberOfPoints: 1,
    previewImage: null as File | null,
    temperatureRecords: [] as Array<{
      id: number
      point: string
      description: string
      temperature: number
      status: 'Normal' | 'Warning' | 'Critical'
    }>
  })

  // Debug: Log when lrsSessions changes
  useEffect(() => {
    console.log('LRS Sessions updated:', lrsSessions.length, lrsSessions.map(s => ({ id: s.id, tagNumber: s.tagNumber })))
  }, [lrsSessions])

  // Initialize data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          fetchEquipment(),
          fetchSessions(),
          fetchLrsSessions()
        ])
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Keyboard navigation for instruction modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showInstructionModal) return
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          setCurrentInstructionImage((prev) => 
            prev === 0 ? espInstructionImages.length - 1 : prev - 1
          )
          break
        case 'ArrowRight':
          event.preventDefault()
          setCurrentInstructionImage((prev) => 
            prev === espInstructionImages.length - 1 ? 0 : prev + 1
          )
          break
        case 'Escape':
          event.preventDefault()
          setShowInstructionModal(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showInstructionModal, espInstructionImages.length])

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
    }
  }

  const fetchLrsSessions = async () => {
    try {
      const response = await fetch('/api/lrs-sessions')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched LRS sessions:', data) // Debug log
        setLrsSessions(data)
      } else {
        console.error('Failed to fetch LRS sessions:', response.statusText)
        // Set mock data if API fails
        setLrsSessions([
          {
            id: 1,
            tagNumber: 'lrs66',
            equipmentName: 'LRS System 66',
            equipmentType: 'LRS - Contactor',
            inspector: 'test',
            numberOfPoints: 3,
            date: new Date().toISOString(),
            temperatureRecords: [
              {
                id: 1,
                point: 'Point 1',
                description: 'r',
                temperature: 6,
                status: 'Normal' as const
              },
              {
                id: 2,
                point: 'Point 2', 
                description: 'r',
                temperature: 0,
                status: 'Normal' as const
              },
              {
                id: 3,
                point: 'Point 3',
                description: 'r', 
                temperature: 0,
                status: 'Normal' as const
              }
            ],
            previewImage: 'lrs66-preview.jpg'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching LRS sessions:', error)
      // Set mock data on error
      setLrsSessions([
        {
          id: 1,
          tagNumber: 'lrs66',
          equipmentName: 'LRS System 66',
          equipmentType: 'LRS - Contactor',
          inspector: 'test',
          numberOfPoints: 3,
          date: new Date().toISOString(),
          temperatureRecords: [
            {
              id: 1,
              point: 'Point 1',
              description: 'r',
              temperature: 6,
              status: 'Normal' as const
            },
            {
              id: 2,
              point: 'Point 2',
              description: 'r',
              temperature: 0,
              status: 'Normal' as const
            },
            {
              id: 3,
              point: 'Point 3',
              description: 'r',
              temperature: 0,
              status: 'Normal' as const
            }
          ],
          previewImage: 'lrs66-preview.jpg'
        }
      ])
    }
  }

  // LRS-specific handlers
  const handleLrsTagNumberChange = (tagNumber: string) => {
    setLrsFormData(prev => ({ ...prev, tagNumber }))
    
    // Auto-populate equipment name and type if found in equipment master
    const foundEquipment = equipment.find(eq => eq.tagNo === tagNumber)
    if (foundEquipment) {
      setLrsFormData(prev => ({
        ...prev,
        tagNumber,
        equipmentName: foundEquipment.equipmentName,
        equipmentType: foundEquipment.equipmentType
      }))
    }
  }

  const handleLrsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (isLrsSubmitting) {
      return
    }
    
    if (!lrsFormData.tagNumber || !lrsFormData.equipmentName || !lrsFormData.inspector) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLrsSubmitting(true)

      const sessionData = {
        tagNumber: lrsFormData.tagNumber,
        equipmentName: lrsFormData.equipmentName,
        equipmentType: lrsFormData.equipmentType,
        inspector: lrsFormData.inspector,
        numberOfPoints: lrsFormData.numberOfPoints,
        temperatureRecords: Array.from({ length: lrsFormData.numberOfPoints }, (_, i) => ({
          point: `Point ${i + 1}`,
          description: `Measurement point ${i + 1}`,
          temperature: 0,
          status: 'Normal' as const
        })),
        previewImage: lrsFormData.previewImage ? 'preview-image.jpg' : undefined
      }

      console.log('Submitting session data:', sessionData)

      if (editingLrsSession) {
        // Update existing session
        const response = await fetch(`/api/lrs-sessions/${editingLrsSession.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData)
        })

        if (!response.ok) {
          throw new Error('Failed to update LRS session')
        }

        toast({
          title: "Success",
          description: "LRS session updated successfully",
        })
      } else {
        // Create new session
        const response = await fetch('/api/lrs-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData)
        })

        if (!response.ok) {
          throw new Error('Failed to create LRS session')
        }

        toast({
          title: "Success",
          description: "New LRS session created successfully",
        })
      }

      // Refresh sessions list with a small delay to ensure backend updates
      setTimeout(async () => {
        await fetchLrsSessions()
      }, 200)
      
      setShowLrsForm(false)
      setEditingLrsSession(null)
      resetLrsForm()

      // Force a small delay to ensure state updates
      setTimeout(() => {
        console.log('Current LRS sessions after save:', lrsSessions.length)
      }, 300)

    } catch (error) {
      console.error('Error saving LRS session:', error)
      toast({
        title: "Error",
        description: "Failed to save LRS session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLrsSubmitting(false)
    }
  }

  const downloadLrsExcel = (sessionId?: number) => {
    if (!lrsSessions.length) {
      toast({
        title: "No Data",
        description: "No LRS sessions available to export",
        variant: "destructive",
      })
      return
    }

    const sessionsToExport = sessionId 
      ? lrsSessions.filter(session => session.id === sessionId)
      : lrsSessions

    // Sort sessions by date (newest first)
    const sortedSessions = sessionsToExport.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const exportData = sortedSessions.flatMap(session =>
      session.temperatureRecords.map(record => ({
        'Recording Date': record.createdAt ? format(new Date(record.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy'),
        'Recording Time': record.createdAt ? format(new Date(record.createdAt), 'HH:mm:ss') : format(new Date(), 'HH:mm:ss'),
        'Day of Week': record.createdAt ? format(new Date(record.createdAt), 'EEEE') : format(new Date(), 'EEEE'),
        'Month Year': record.createdAt ? format(new Date(record.createdAt), 'MMMM yyyy') : format(new Date(), 'MMMM yyyy'),
        'Tag Number': session.tagNumber,
        'Equipment Name': session.equipmentName,
        'Equipment Type': session.equipmentType,
        'Inspector': session.inspector,
        'Planned Points': session.numberOfPoints,
        'Actual Points Recorded': session.temperatureRecords.length,
        'Point Description': record.point,
        'Detailed Description': record.description,
        'Temperature (°C)': record.temperature,
        'Status': record.status,
        'Max Temperature (°C)': Math.max(...session.temperatureRecords.map(r => r.temperature)),
        'Min Temperature (°C)': Math.min(...session.temperatureRecords.map(r => r.temperature)),
        'Avg Temperature (°C)': (session.temperatureRecords.reduce((sum, r) => sum + r.temperature, 0) / session.temperatureRecords.length).toFixed(1),
        'Session Status': session.temperatureRecords.every(r => r.status === 'Normal') ? 'All Normal' :
                         session.temperatureRecords.some(r => r.status === 'Critical') ? 'Has Critical' :
                         'Has Warning',
        'Recording Completion': `${session.temperatureRecords.length}/${session.numberOfPoints} (${Math.round((session.temperatureRecords.length / session.numberOfPoints) * 100)}%)`
      }))
    )

    // Group data by date for summary
    const dateGroups = sortedSessions.reduce((groups, session) => {
      const dateKey = format(new Date(session.date), 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(session)
      return groups
    }, {} as Record<string, typeof sortedSessions>)

    // Create summary data by date
    const summaryData = Object.entries(dateGroups).map(([dateKey, sessions]) => {
      const allRecords = sessions.flatMap(s => s.temperatureRecords)
      const criticalCount = allRecords.filter(r => r.status === 'Critical').length
      const warningCount = allRecords.filter(r => r.status === 'Warning').length
      const normalCount = allRecords.filter(r => r.status === 'Normal').length
      
      return {
        'Date': format(new Date(dateKey), 'dd/MM/yyyy'),
        'Day of Week': format(new Date(dateKey), 'EEEE'),
        'Sessions Count': sessions.length,
        'Total Measurements': allRecords.length,
        'Critical Readings': criticalCount,
        'Warning Readings': warningCount,
        'Normal Readings': normalCount,
        'Max Temperature': allRecords.length > 0 ? Math.max(...allRecords.map(r => r.temperature)) : 0,
        'Min Temperature': allRecords.length > 0 ? Math.min(...allRecords.map(r => r.temperature)) : 0,
        'Avg Temperature': allRecords.length > 0 ? (allRecords.reduce((sum, r) => sum + r.temperature, 0) / allRecords.length).toFixed(1) : 0,
        'Equipment Types': [...new Set(sessions.map(s => s.equipmentType))].join(', '),
        'Inspectors': [...new Set(sessions.map(s => s.inspector))].join(', ')
      }
    })

    // Create the main data worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    
    // Add auto filters
    worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1' }
    
    // Set column widths for main data sheet
    const columnWidths = [
      { wch: 12 }, // Date
      { wch: 8 },  // Time
      { wch: 12 }, // Day of Week
      { wch: 15 }, // Month
      { wch: 12 }, // Tag Number
      { wch: 25 }, // Equipment Name
      { wch: 20 }, // Equipment Type
      { wch: 15 }, // Inspector
      { wch: 12 }, // Planned Points
      { wch: 12 }, // Actual Points
      { wch: 20 }, // Point Description
      { wch: 30 }, // Detailed Description
      { wch: 15 }, // Temperature
      { wch: 12 }, // Status
      { wch: 15 }, // Max Temperature
      { wch: 15 }, // Min Temperature
      { wch: 15 }, // Avg Temperature
      { wch: 16 }, // Session Status
      { wch: 18 }  // Recording Completion
    ]
    worksheet['!cols'] = columnWidths

    // Style header row - update column count for new fields
    for (let col = 0; col < 19; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellRef]) continue
      
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "4472C4" } },
        font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      }
    }

    // Color-code status cells (column 13 - Status)
    for (let row = 1; row <= exportData.length; row++) {
      const statusCell = XLSX.utils.encode_cell({ r: row, c: 13 })
      const status = exportData[row - 1]['Status']
      
      if (worksheet[statusCell]) {
        let fillColor = "FFFFFF"
        if (status === 'Normal') fillColor = "D4F6D4"
        else if (status === 'Warning') fillColor = "FFF2CC"
        else if (status === 'Critical') fillColor = "FFE6E6"
        
        worksheet[statusCell].s = {
          fill: { fgColor: { rgb: fillColor } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      }
    }

    // Create summary worksheet
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
    summaryWorksheet['!autofilter'] = { ref: summaryWorksheet['!ref'] || 'A1' }
    
    // Set column widths for summary sheet
    const summaryColumnWidths = [
      { wch: 12 }, // Date
      { wch: 12 }, // Day of Week
      { wch: 12 }, // Sessions Count
      { wch: 15 }, // Total Measurements
      { wch: 15 }, // Critical Readings
      { wch: 15 }, // Warning Readings
      { wch: 15 }, // Normal Readings
      { wch: 15 }, // Max Temperature
      { wch: 15 }, // Min Temperature
      { wch: 15 }, // Avg Temperature
      { wch: 25 }, // Equipment Types
      { wch: 20 }  // Inspectors
    ]
    summaryWorksheet['!cols'] = summaryColumnWidths

    // Style summary header row
    for (let col = 0; col < 12; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!summaryWorksheet[cellRef]) continue
      
      summaryWorksheet[cellRef].s = {
        fill: { fgColor: { rgb: "2E7D32" } },
        font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      }
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LRS Temperature Data')
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Daily Summary')
    
    const filename = sessionId 
      ? `LRS_Session_${sessionsToExport[0]?.tagNumber}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`
      : `LRS_Thermography_by_Date_${format(new Date(), 'dd-MM-yyyy')}.xlsx`
    
    XLSX.writeFile(workbook, filename)

    toast({
      title: "Export Complete",
      description: `LRS thermography data exported with date organization as ${filename}`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    
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
        const errorData = await response.json()
        
        // Handle duplicate session error specifically
        if (response.status === 409) {
          toast({
            title: "Duplicate Session",
            description: errorData.message || "A session with the same ESP code and date already exists.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: errorData.message || `Error ${editingSession ? 'updating' : 'saving'} ESP session. Please try again.`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: `Error ${editingSession ? 'updating' : 'saving'} ESP session. Please try again.`,
        variant: "destructive",
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

  const resetLrsForm = () => {
    setLrsFormData({
      tagNumber: '',
      equipmentName: '',
      equipmentType: '',
      inspector: '',
      numberOfPoints: 1,
      previewImage: null,
      temperatureRecords: []
    })
    setEditingLrsSession(null)
  }

  const updateLrsNumberOfPoints = (numberOfPoints: number) => {
    setLrsFormData(prev => ({
      ...prev,
      numberOfPoints
    }))
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
        (record.rdi68 && record.rdi68 !== '') ||
        (record.rdi69 && record.rdi69 !== '') ||
        (record.rdi70 && record.rdi70 !== '')
      )
    }).length
  }

  const downloadExcel = async (sessionFilter?: EspSession) => {
    try {
      const XLSX = await import('xlsx')
      
      // Filter data based on sessionFilter parameter
      const sessionsToExport = sessionFilter ? [sessionFilter] : filteredSessions
      
      // Prepare organized data with proper grouping
      const exportData = sessionsToExport.flatMap(session => 
        session.transformerRecords.map((record, index) => ({
          // Session Information
          'ESP Code': session.espCode,
          'Equipment Name': equipment.find(eq => eq.tagNo === session.espCode)?.equipmentName || 'ESP MCC Panel',
          'Month': months.find(m => m.value === session.month)?.label || session.month,
          'Inspection Date': format(new Date(session.inspectionDate), 'dd/MM/yyyy'),
          'Inspector': session.doneBy || '',
          
          // Transformer Details
          'Transformer': record.transformerNo,
          'Step': record.step,
          
          // MCCB Temperature Measurements (°C)
          'MCCB R-Phase (°C)': record.mccbIcRPhase || '-',
          'MCCB B-Phase (°C)': record.mccbIcBPhase || '-',
          'MCCB C O/G-1 (°C)': record.mccbCOg1 || '-',
          'MCCB C O/G-2 (°C)': record.mccbCOg2 || '-',
          'MCCB Body Temp (°C)': record.mccbBodyTemp || '-',
          
          // Cooling System Measurements
          'SCR Cooling Fins (°C)': record.scrCoolingFinsTemp || '-',
          'SCR Cooling Fan': record.scrCoolingFan || '-',
          'Panel Exhaust Fan': record.panelExhaustFan || '-',
          'MCC Forced Cooling Fan': record.mccForcedCoolingFanTemp || '-',
          
          // RDI Relay Status
          'RDI-68 Relay': record.rdi68 || '-',
          'RDI-69 Relay': record.rdi69 || '-',
          'RDI-70 Relay': record.rdi70 || '-',
          
          // Additional Data
          'KV/MA': record.kvMa || '-',
          'SP Min': record.spMin || '-',
          
          // Session Status & Notes
          'Session Status': session.isCompleted ? 'Completed' : 'In Progress',
          'Completion Progress': `${session.transformerRecords.filter(r => 
            (r.mccbIcRPhase && r.mccbIcRPhase > 0) ||
            (r.mccbIcBPhase && r.mccbIcBPhase > 0) ||
            (r.mccbBodyTemp && r.mccbBodyTemp > 0)
          ).length}/3 Transformers`,
          'Session Remarks': session.remarks || '',
          'Record Created': format(new Date(session.createdAt), 'dd/MM/yyyy HH:mm'),
          
          // Temperature Analysis
          'Max Temperature (°C)': Math.max(
            record.mccbIcRPhase || 0,
            record.mccbIcBPhase || 0,
            record.mccbCOg1 || 0,
            record.mccbCOg2 || 0,
            record.mccbBodyTemp || 0,
            record.scrCoolingFinsTemp || 0
          ) || '-',
          'Temperature Status': (() => {
            const maxTemp = Math.max(
              record.mccbIcRPhase || 0,
              record.mccbIcBPhase || 0,
              record.mccbCOg1 || 0,
              record.mccbCOg2 || 0,
              record.mccbBodyTemp || 0,
              record.scrCoolingFinsTemp || 0
            )
            if (maxTemp > 80) return 'Critical'
            if (maxTemp > 60) return 'Warning'
            return maxTemp > 0 ? 'Normal' : 'No Data'
          })()
        }))
      )

      // Create worksheet with organized data
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      
      // Add auto filters to the worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1' }
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 12 }, // ESP Code
        { wch: 25 }, // Equipment Name
        { wch: 12 }, // Month
        { wch: 15 }, // Inspection Date
        { wch: 15 }, // Inspector
        { wch: 12 }, // Transformer
        { wch: 8 },  // Step
        { wch: 16 }, // MCCB R-Phase
        { wch: 16 }, // MCCB B-Phase
        { wch: 16 }, // MCCB C O/G-1
        { wch: 16 }, // MCCB C O/G-2
        { wch: 16 }, // MCCB Body Temp
        { wch: 18 }, // SCR Cooling Fins
        { wch: 16 }, // SCR Cooling Fan
        { wch: 18 }, // Panel Exhaust Fan
        { wch: 20 }, // MCC Forced Cooling Fan
        { wch: 14 }, // RDI-68
        { wch: 14 }, // RDI-69
        { wch: 14 }, // RDI-70
        { wch: 10 }, // KV/MA
        { wch: 10 }, // SP Min
        { wch: 15 }, // Session Status
        { wch: 18 }, // Completion Progress
        { wch: 30 }, // Session Remarks
        { wch: 18 }, // Record Created
        { wch: 18 }, // Max Temperature
        { wch: 16 }  // Temperature Status
      ]
      worksheet['!cols'] = columnWidths

      // Add colors and formatting
      if (!worksheet['!rows']) worksheet['!rows'] = []
      
      // Style header row
      for (let col = 0; col < 27; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!worksheet[cellRef]) continue
        
        worksheet[cellRef].s = {
          fill: { fgColor: { rgb: "4472C4" } },
          font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      }

      // Color-code temperature status cells
      for (let row = 1; row <= exportData.length; row++) {
        // Temperature Status column (column 26, index from 0)
        const tempStatusCell = XLSX.utils.encode_cell({ r: row, c: 26 })
        const tempStatus = exportData[row - 1]['Temperature Status']
        
        if (worksheet[tempStatusCell]) {
          let fillColor = "FFFFFF" // Default white
          if (tempStatus === 'Critical') fillColor = "FFE6E6" // Light red
          else if (tempStatus === 'Warning') fillColor = "FFF2CC" // Light yellow
          else if (tempStatus === 'Normal') fillColor = "E6F7E6" // Light green
          
          worksheet[tempStatusCell].s = {
            fill: { fgColor: { rgb: fillColor } },
            font: { sz: 10 },
            alignment: { horizontal: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } }
            }
          }
        }

        // Session Status column (column 22)
        const sessionStatusCell = XLSX.utils.encode_cell({ r: row, c: 22 })
        const sessionStatus = exportData[row - 1]['Session Status']
        
        if (worksheet[sessionStatusCell]) {
          const fillColor = sessionStatus === 'Completed' ? "E6F7E6" : "FFF2CC"
          worksheet[sessionStatusCell].s = {
            fill: { fgColor: { rgb: fillColor } },
            font: { sz: 10 },
            alignment: { horizontal: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } }
            }
          }
        }

        // Add borders to all data cells
        for (let col = 0; col < 27; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
          if (worksheet[cellRef] && !worksheet[cellRef].s) {
            worksheet[cellRef].s = {
              border: {
                top: { style: "thin", color: { rgb: "CCCCCC" } },
                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } }
              },
              font: { sz: 10 }
            }
          }
        }
      }

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ESP Thermography Data')
      
      // Add summary sheet with enhanced styling
      const summaryData = [
        { 'Summary': 'Total ESP Sessions', 'Value': sessionsToExport.length },
        { 'Summary': 'Completed Sessions', 'Value': sessionsToExport.filter(s => s.isCompleted).length },
        { 'Summary': 'In Progress Sessions', 'Value': sessionsToExport.filter(s => !s.isCompleted).length },
        { 'Summary': 'Total Transformer Records', 'Value': sessionsToExport.reduce((sum, s) => sum + s.transformerRecords.length, 0) },
        { 'Summary': 'Critical Temperature Records', 'Value': sessionsToExport.reduce((sum, s) => 
          sum + s.transformerRecords.filter(r => {
            const maxTemp = Math.max(
              r.mccbIcRPhase || 0, r.mccbIcBPhase || 0, r.mccbCOg1 || 0, 
              r.mccbCOg2 || 0, r.mccbBodyTemp || 0, r.scrCoolingFinsTemp || 0
            )
            return maxTemp > 80
          }).length, 0) },
        { 'Summary': 'Warning Temperature Records', 'Value': sessionsToExport.reduce((sum, s) => 
          sum + s.transformerRecords.filter(r => {
            const maxTemp = Math.max(
              r.mccbIcRPhase || 0, r.mccbIcBPhase || 0, r.mccbCOg1 || 0, 
              r.mccbCOg2 || 0, r.mccbBodyTemp || 0, r.scrCoolingFinsTemp || 0
            )
            return maxTemp > 60 && maxTemp <= 80
          }).length, 0) },
        { 'Summary': 'Export Date', 'Value': format(new Date(), 'dd/MM/yyyy HH:mm') },
        { 'Summary': 'Export Type', 'Value': sessionFilter ? `Single Session (${sessionFilter.espCode})` : 'All Filtered Sessions' },
        { 'Summary': 'Export Filters Applied', 'Value': hasActiveFilters ? 'Yes' : 'No' }
      ]
      
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
      summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 25 }]
      
      // Style summary sheet headers
      for (let row = 0; row < summaryData.length; row++) {
        const summaryCell = XLSX.utils.encode_cell({ r: row, c: 0 })
        const valueCell = XLSX.utils.encode_cell({ r: row, c: 1 })
        
        if (summaryWorksheet[summaryCell]) {
          summaryWorksheet[summaryCell].s = {
            fill: { fgColor: { rgb: "E7E6E6" } },
            font: { bold: true, sz: 11 },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          }
        }
        
        if (summaryWorksheet[valueCell]) {
          summaryWorksheet[valueCell].s = {
            font: { sz: 11 },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          }
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')
      
      // Generate filename with professional naming
      const fileName = sessionFilter 
        ? `ESP_${sessionFilter.espCode}_Thermography_${format(new Date(sessionFilter.inspectionDate), 'dd-MM-yyyy')}.xlsx`
        : `ESP_Thermography_Report_${format(new Date(), 'dd-MM-yyyy_HHmm')}.xlsx`
      
      XLSX.writeFile(workbook, fileName)
      
      toast({
        title: "Export Successful",
        description: `ESP thermography data exported to ${fileName}`,
        variant: "default",
      })
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast({
        title: "Export Failed",
        description: "Error exporting ESP thermography data to Excel",
        variant: "destructive",
      })
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
            rdi68: record.rdi68 || '',
            rdi69: record.rdi69 || '',
            rdi70: record.rdi70 || ''
          }))
        : formData.transformers
    })
    
    // Auto-fill equipment data
    handleEspCodeChange(session.espCode)
    
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    if (isSubmitting) return // Prevent canceling during submission
    setEditingSession(null)
    setShowForm(false)
    resetForm()
  }

  const nextInstructionImage = () => {
    setCurrentInstructionImage((prev) => 
      prev === espInstructionImages.length - 1 ? 0 : prev + 1
    )
  }

  const prevInstructionImage = () => {
    setCurrentInstructionImage((prev) => 
      prev === 0 ? espInstructionImages.length - 1 : prev - 1
    )
  }

  const goToInstructionImage = (index: number) => {
    setCurrentInstructionImage(index)
  }

  const openInstructionModal = (index?: number) => {
    if (index !== undefined) {
      setCurrentInstructionImage(index)
    }
    setShowInstructionModal(true)
  }

  const closeInstructionModal = () => {
    setShowInstructionModal(false)
  }

  const startTemperatureRecording = (session: LrsSession) => {
    setRecordingSessionId(session.id)
    
    // Ensure we have temperature records, create them if empty
    if (session.temperatureRecords && session.temperatureRecords.length > 0) {
      setRecordingData(session.temperatureRecords.map(record => ({ ...record })))
    } else {
      // Create default temperature records if they don't exist
      const defaultRecords = Array.from({ length: session.numberOfPoints }, (_, i) => ({
        id: i + 1,
        point: `Point ${i + 1}`,
        description: `Measurement point ${i + 1}`,
        temperature: 0,
        status: 'Normal' as const
      }))
      setRecordingData(defaultRecords)
    }
  }

  const cancelTemperatureRecording = () => {
    if (isRecordingSubmitting) return // Prevent canceling during submission
    setRecordingSessionId(null)
    setRecordingData([])
  }

  const saveTemperatureRecording = async () => {
    if (!recordingSessionId || isRecordingSubmitting) return

    try {
      setIsRecordingSubmitting(true)
      
      const session = lrsSessions.find(s => s.id === recordingSessionId)
      if (!session) return

      const response = await fetch(`/api/lrs-sessions/${recordingSessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagNumber: session.tagNumber,
          equipmentName: session.equipmentName,
          equipmentType: session.equipmentType,
          inspector: session.inspector,
          numberOfPoints: session.numberOfPoints,
          temperatureRecords: recordingData
            .filter(record => record.temperature && record.temperature > 0) // Only save records with actual temperatures
            .map(record => ({
              point: record.point,
              description: record.description,
              temperature: record.temperature,
              status: record.status
            }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update temperature recordings')
      }

      const recordsAdded = recordingData.filter(record => record.temperature > 0).length

      toast({
        title: "Success",
        description: `${recordsAdded} temperature recording${recordsAdded > 1 ? 's' : ''} added successfully`,
      })

      await fetchLrsSessions()
      setRecordingSessionId(null)
      setRecordingData([])

    } catch (error) {
      console.error('Error saving temperature recordings:', error)
      toast({
        title: "Error",
        description: "Failed to save temperature recordings",
        variant: "destructive",
      })
    } finally {
      setIsRecordingSubmitting(false)
    }
  }

  const updateRecordingTemperature = (index: number, temperature: number) => {
    const status = temperature > 80 ? 'Critical' : temperature > 60 ? 'Warning' : 'Normal'
    setRecordingData(prev => prev.map((record, i) => 
      i === index ? { ...record, temperature, status } : record
    ))
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
    <div className="container mx-auto p-3 sm:p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
              <Thermometer className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-500 flex-shrink-0" />
              <span className="truncate">Thermography Management</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Temperature monitoring for ESP transformers and LRS equipment
            </p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('esp')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'esp'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="h-4 w-4 mr-2 inline" />
            ESP MCC
          </button>
          <button
            onClick={() => setActiveTab('lrs')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'lrs'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Thermometer className="h-4 w-4 mr-2 inline" />
            LRS & Motor
          </button>
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
            onClick={() => activeTab === 'esp' ? setShowForm(true) : setShowLrsForm(true)} 
            size="sm" 
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">New </span>
            {activeTab === 'esp' ? 'ESP Session' : 'LRS Session'}
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <>
          {/* ESP Instructions Carousel */}
          <Card className="mb-4 sm:mb-6 border-2 border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30">
            <CardHeader className="pb-3 bg-blue-100 dark:bg-blue-900/30">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-blue-800 dark:text-blue-200">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                🖼️ ESP Thermography Instructions - Image Gallery
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-blue-700 dark:text-blue-300">
                📋 Follow these visual guides for proper ESP thermography inspection procedures
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Carousel Image Gallery */}
              <div className="relative">
                <Carousel className="w-full max-w-4xl mx-auto">
                  <CarouselContent>
                    {espInstructionImages.map((imageSrc, index) => (
                      <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                          <Card className="border-2 hover:border-blue-400 dark:hover:border-blue-500 transition-colors dark:bg-gray-800/50">
                            <CardContent className="p-0">
                              <div 
                                className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
                                onClick={() => {
                                  setCurrentInstructionImage(index)
                                  setShowInstructionModal(true)
                                }}
                              >
                                <Image
                                  src={imageSrc}
                                  alt={`ESP Instruction ${index + 1}`}
                                  fill
                                  className="object-contain transition-transform group-hover:scale-105"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  onError={(e) => {
                                    console.error(`Failed to load image: ${imageSrc}`, e)
                                  }}
                                  onLoad={() => {
                                    console.log(`Successfully loaded image: ${imageSrc}`)
                                  }}
                                />
                                
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    <span className="text-sm">View Full Size</span>
                                  </div>
                                </div>
                                
                                {/* Image Number */}
                                <div className="absolute top-2 left-2 bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                  {index + 1}
                                </div>
                                
                                {/* Current indicator */}
                                {currentInstructionImage === index && (
                                  <div className="absolute top-2 right-2 bg-green-500 dark:bg-green-400 text-white p-1 rounded-full">
                                    <CheckCircle className="h-3 w-3" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Image Title */}
                              <div className="p-3 text-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  ESP Instruction Step {index + 1}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex" />
                  <CarouselNext className="hidden sm:flex" />
                </Carousel>
                
                {/* Mobile Navigation Dots */}
                <div className="flex justify-center gap-2 mt-4 sm:hidden">
                  {espInstructionImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentInstructionImage(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentInstructionImage === index
                          ? 'bg-blue-600 dark:bg-blue-400'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                      aria-label={`Go to instruction ${index + 1}`}
                    />
                  ))}
                </div>
                
                {/* Gallery Instructions h */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <div className="hidden sm:block">
                    Use arrow buttons to navigate • Click any image to view in full screen
                  </div>
                  <div className="sm:hidden">
                    Swipe to navigate • Tap any image to view full screen
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                {editingSession ? 'Edit ESP Thermography Session' : 'New ESP Thermography Session'}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {editingSession 
                  ? `Editing session for ${editingSession.espCode} - Complete or update temperature measurements`
                  : 'Record temperature measurements for all transformers (TF1, TF2, TF3) in one session'
                }
              </CardDescription>
            </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Session Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="espCode" className="text-sm font-medium">ESP Code / Tag No</Label>
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
                  <Label htmlFor="equipmentName" className="text-sm font-medium">Equipment Name</Label>
                  <Input
                    id="equipmentName"
                    value={formData.equipmentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, equipmentName: e.target.value }))}
                    placeholder="e.g., ESP MCC Panel 1"
                    className="w-full text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="equipmentType" className="text-sm font-medium">Equipment Type</Label>
                  <Select 
                    value={formData.equipmentType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, equipmentType: value }))}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select equipment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map((type) => (
                        <SelectItem key={type} value={type} className="text-sm">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Inspection Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="month" className="text-sm font-medium">Month</Label>
                  <Select 
                    value={formData.month} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, month: value }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()} className="text-sm">
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="inspectionDate" className="text-sm font-medium">Inspection Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal text-sm',
                          !formData.inspectionDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
                  <Label htmlFor="doneBy" className="text-sm font-medium">Inspector</Label>
                  <Input
                    id="doneBy"
                    value={formData.doneBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, doneBy: e.target.value }))}
                    placeholder="Inspector name"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Transformers Measurements */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold">Transformer Measurements</h3>
                
                {formData.transformers.map((transformer, transformerIndex) => (
                  <Card key={transformer.transformerNo} className="p-3 sm:p-4 dark:bg-gray-800/50">
                    <h4 className="text-sm sm:text-base font-medium mb-3 sm:mb-4 flex items-center gap-2">
                      <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                      {transformer.transformerNo} - Step {transformerIndex + 1}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {/* MCCB Measurements */}
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">MCCB R-Phase (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.mccbIcRPhase}
                          onChange={(e) => updateTransformerField(transformerIndex, 'mccbIcRPhase', e.target.value)}
                          placeholder="Temperature"
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">MCCB B-Phase (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.mccbIcBPhase}
                          onChange={(e) => updateTransformerField(transformerIndex, 'mccbIcBPhase', e.target.value)}
                          placeholder="Temperature"
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">MCCB C O/G-1 (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.mccbCOg1}
                          onChange={(e) => updateTransformerField(transformerIndex, 'mccbCOg1', e.target.value)}
                          placeholder="Temperature"
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">MCCB C O/G-2 (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.mccbCOg2}
                          onChange={(e) => updateTransformerField(transformerIndex, 'mccbCOg2', e.target.value)}
                          placeholder="Temperature"
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">MCCB Body (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.mccbBodyTemp}
                          onChange={(e) => updateTransformerField(transformerIndex, 'mccbBodyTemp', e.target.value)}
                          placeholder="Temperature"
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">SCR Cooling Fins (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.scrCoolingFinsTemp}
                          onChange={(e) => updateTransformerField(transformerIndex, 'scrCoolingFinsTemp', e.target.value)}
                          placeholder="Temperature"
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">RDI-68 Relay</Label>
                        <Select 
                          value={transformer.rdi68} 
                          onValueChange={(value) => updateTransformerField(transformerIndex, 'rdi68', value)}
                        >
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue placeholder="Select relay status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="On" className="text-sm">On (Working)</SelectItem>
                            <SelectItem value="Off" className="text-sm">Off (Not Working)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">RDI-69 Relay</Label>
                        <Select 
                          value={transformer.rdi69} 
                          onValueChange={(value) => updateTransformerField(transformerIndex, 'rdi69', value)}
                        >
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue placeholder="Select relay status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="On" className="text-sm">On (Working)</SelectItem>
                            <SelectItem value="Off" className="text-sm">Off (Not Working)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">RDI-70 Relay</Label>
                        <Select 
                          value={transformer.rdi70} 
                          onValueChange={(value) => updateTransformerField(transformerIndex, 'rdi70', value)}
                        >
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue placeholder="Select relay status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="On" className="text-sm">On (Working)</SelectItem>
                            <SelectItem value="Off" className="text-sm">Off (Not Working)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Remarks */}
              <div>
                <Label htmlFor="remarks" className="text-sm font-medium">Session Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Overall session notes and observations..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingSession ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    editingSession ? 'Update ESP Session' : 'Save ESP Session'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </>
      )}

      {/* LRS Form Modal */}
      {showLrsForm && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Thermometer className="h-4 w-4 sm:h-5 sm:w-5" />
              {editingLrsSession ? 'Edit LRS Thermography Session' : 'New LRS Thermography Session'}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {editingLrsSession 
                ? `Editing session for ${editingLrsSession.tagNumber} - Update session details. Temperature recording is done separately in history section.`
                : 'Setup new LRS/Motor thermography session. Temperature recording will be done later in the history section.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleLrsSubmit} className="space-y-4 sm:space-y-6">
              {/* Session Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="tagNumber" className="text-sm font-medium">Tag Number</Label>
                  <Combobox
                    options={equipment.map((eq) => ({
                      value: eq.tagNo,
                      label: `${eq.tagNo} - ${eq.equipmentName}`,
                    }))}
                    value={lrsFormData.tagNumber}
                    onValueChange={handleLrsTagNumberChange}
                    placeholder="Select or add Tag Number (e.g., LRS-01)"
                    searchPlaceholder="Search Tag Number..."
                    allowCustom={true}
                    onAddNew={(newTagNumber) => {
                      const newEquipment = {
                        id: Date.now(),
                        tagNo: newTagNumber,
                        equipmentName: `New LRS Equipment - ${newTagNumber}`,
                        equipmentType: "LRS (Liquid Resistor Starter)",
                        location: null,
                      }
                      setEquipment((prev) => [...prev, newEquipment])
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="equipmentName" className="text-sm font-medium">Equipment Name</Label>
                  <Input
                    id="equipmentName"
                    value={lrsFormData.equipmentName}
                    onChange={(e) => setLrsFormData(prev => ({ ...prev, equipmentName: e.target.value }))}
                    placeholder="e.g., LRS Starter Panel 1"
                    className="w-full text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="equipmentType" className="text-sm font-medium">Equipment Type</Label>
                  <Select 
                    value={lrsFormData.equipmentType} 
                    onValueChange={(value) => setLrsFormData(prev => ({ ...prev, equipmentType: value }))}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select equipment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.filter(type => type.includes('LRS') || type.includes('Motor')).map((type) => (
                        <SelectItem key={type} value={type} className="text-sm">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Inspector and Measurement Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="inspector" className="text-sm font-medium">Inspector</Label>
                  <Input
                    id="inspector"
                    value={lrsFormData.inspector}
                    onChange={(e) => setLrsFormData(prev => ({ ...prev, inspector: e.target.value }))}
                    placeholder="Inspector name"
                    className="w-full text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="numberOfPoints" className="text-sm font-medium">Number of Measurement Points</Label>
                  <Select 
                    value={lrsFormData.numberOfPoints.toString()} 
                    onValueChange={(value) => updateLrsNumberOfPoints(parseInt(value))}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select number of points" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()} className="text-sm">
                          {num} Point{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="previewImage" className="text-sm font-medium">Preview Image</Label>
                  <Input
                    id="previewImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setLrsFormData(prev => ({ ...prev, previewImage: file }))
                      }
                    }}
                    className="w-full text-sm"
                  />
                </div>
              </div>



              {/* Preview Image Display */}
              {lrsFormData.previewImage && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview Image</Label>
                  <div className="border rounded-lg p-4">
                    <img
                      src={URL.createObjectURL(lrsFormData.previewImage)}
                      alt="LRS Equipment Preview"
                      className="max-w-full h-auto max-h-64 mx-auto rounded"
                    />
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowLrsForm(false)
                    setEditingLrsSession(null)
                    resetLrsForm()
                  }}
                  className="w-full sm:w-auto"
                  disabled={isLrsSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isLrsSubmitting}>
                  {isLrsSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingLrsSession ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    editingLrsSession ? 'Update LRS Session' : 'Save LRS Session'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Conditional content based on active tab */}
      {activeTab === 'esp' ? (
        <>
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
        </>
      ) : (
        <>
          {/* LRS Content - Sessions List */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div>
                  <CardTitle className="text-sm sm:text-base">LRS & Motor Thermography Sessions ({lrsSessions.length})</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Temperature monitoring sessions for LRS and Motor equipment
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    console.log('Manual refresh triggered, current sessions:', lrsSessions.length)
                    fetchLrsSessions()
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Refresh ({lrsSessions.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Thermometer className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading LRS sessions...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {lrsSessions.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <Thermometer className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground text-xs sm:text-sm">No LRS sessions found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add your first LRS thermography session
                      </p>
                    </div>
                  ) : (
                    [...lrsSessions].reverse().map((session, index) => (
                    <div key={`lrs-session-${session.id}-${session.tagNumber}-${index}`} className="space-y-4">
                      <Card className="overflow-hidden hover:shadow-md transition-shadow dark:bg-gray-800/50 dark:hover:shadow-lg">
                        <CardContent className="p-4 sm:p-6">
                          {/* Session Header */}
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                <h3 className="text-lg font-semibold break-words">
                                  {session.tagNumber}
                                </h3>
                                <Badge variant="outline" className="text-xs px-2 py-1 w-fit">
                                  {session.equipmentType}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-muted-foreground mb-2">
                                <strong>{session.equipmentName}</strong>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  {format(new Date(session.date), 'MMM dd, yyyy')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {session.inspector}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Thermometer className="h-4 w-4" />
                                  {session.numberOfPoints} Point{session.numberOfPoints > 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              {/* Preview Image */}
                              {session.previewImage && (
                                <div className="mt-4">
                                  <div className="text-xs text-muted-foreground mb-2">Preview Image</div>
                                  <div 
                                    className="relative w-32 h-24 rounded-lg overflow-hidden border bg-gray-50 cursor-pointer hover:border-blue-400 transition-colors group"
                                    onClick={() => {
                                      const imageSrc = session.previewImage?.startsWith('/') ? session.previewImage : `/uploads/${session.previewImage}`
                                      setCurrentLrsImage(imageSrc)
                                      setShowLrsImageModal(true)
                                    }}
                                  >
                                    <Image
                                      src={session.previewImage.startsWith('/') ? session.previewImage : `/uploads/${session.previewImage}`}
                                      alt={`${session.tagNumber} Preview`}
                                      fill
                                      className="object-cover transition-transform group-hover:scale-105"
                                      onError={(e) => {
                                        // Fallback to placeholder if image fails to load
                                        e.currentTarget.src = '/placeholder.svg'
                                      }}
                                    />
                                    
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        <span>View</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={() => downloadLrsExcel(session.id)}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Excel
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingLrsSession(session);
                                  setLrsFormData({
                                    tagNumber: session.tagNumber,
                                    equipmentName: session.equipmentName,
                                    equipmentType: session.equipmentType,
                                    inspector: session.inspector,
                                    numberOfPoints: session.numberOfPoints,
                                    temperatureRecords: session.temperatureRecords,
                                    previewImage: null
                                  });
                                  setShowLrsForm(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => startTemperatureRecording(session)}
                                variant="default"
                                size="sm"
                                className="text-xs"
                                disabled={recordingSessionId === session.id}
                              >
                                <Thermometer className="h-3 w-3 mr-1" />
                                {recordingSessionId === session.id ? 'Recording...' : 'Record Temps'}
                              </Button>
                            </div>
                          </div>

                          {/* Temperature Records Section */}
                          <div className="mt-6 pt-4 border-t">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setExpandedSessions(prev => 
                                  prev.has(session.id) 
                                    ? new Set([...prev].filter(id => id !== session.id))
                                    : new Set([...prev, session.id])
                                );
                              }}
                              className="w-full justify-between p-2 h-auto hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Temperature Records ({session.temperatureRecords.length}/{session.numberOfPoints})
                                </span>
                                {session.temperatureRecords.length < session.numberOfPoints && (
                                  <Badge variant="secondary" className="text-xs">
                                    {session.numberOfPoints - session.temperatureRecords.length} pending
                                  </Badge>
                                )}
                              </div>
                              {expandedSessions.has(session.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>

                            {expandedSessions.has(session.id) && (
                              <div className="mt-3 space-y-2">
                                {session.temperatureRecords.length > 0 ? (
                                  <div className="grid gap-3">
                                    {session.temperatureRecords.map((record, idx) => (
                                      <div
                                        key={idx}
                                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 bg-muted/30 dark:bg-gray-800/30 rounded-lg border dark:border-gray-700"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm text-foreground dark:text-gray-100">{record.point}</div>
                                          <div className="text-xs text-muted-foreground dark:text-gray-400 mt-1 break-words">{record.description}</div>
                                          {record.createdAt && (
                                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                              📅 {format(new Date(record.createdAt), 'dd/MM/yyyy HH:mm')}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                          <div className="text-right">
                                            <div className="font-mono text-lg font-semibold dark:text-gray-100">
                                              {record.temperature && record.temperature > 0 ? `${record.temperature}°C` : '—'}
                                            </div>
                                            {record.createdAt && (
                                              <div className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                                                {format(new Date(record.createdAt), 'MMM dd, yyyy')}
                                              </div>
                                            )}
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className={`text-xs whitespace-nowrap ${
                                              record.status === 'Normal' ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600' :
                                              record.status === 'Warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600' :
                                              'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600'
                                            }`}
                                          >
                                            {record.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-muted-foreground">
                                    <Thermometer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No temperature records yet</p>
                                    <p className="text-xs">Click "Record Temps" to add measurements</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Temperature Recording Form */}
                      {recordingSessionId === session.id && (
                        <Card className="border-2 border-blue-200 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/30">
                          <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Thermometer className="h-5 w-5 text-blue-600" />
                                  Temperature Recording - {session.tagNumber}
                                </CardTitle>
                                <CardDescription>
                                  Enter temperature measurements for each defined point
                                </CardDescription>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                  📅 Recording Session
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  {format(new Date(), 'EEEE, dd MMMM yyyy')}
                                </div>
                                <div className="text-xs text-muted-foreground dark:text-gray-400">
                                  {format(new Date(), 'HH:mm')} Current Time
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Recording Summary */}
                              <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="text-sm">
                                  <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">Recording Summary</div>
                                  <div className="text-blue-700 dark:text-blue-300 text-xs space-y-1">
                                    <div>• Previous recordings: {session.temperatureRecords.length} measurements saved</div>
                                    <div>• Current session: {recordingData.filter(r => r.temperature > 0).length} new measurements ready</div>
                                    <div>• All recordings will be preserved - new measurements will be added to existing ones</div>
                                  </div>
                                </div>
                              </div>

                              {recordingData.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Thermometer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <p>No temperature recording points available.</p>
                                  <p className="text-sm">This session may need to be recreated with proper measurement points.</p>
                                </div>
                              ) : (
                                recordingData.map((record, index) => (
                                <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
                                  <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Point Description</Label>
                                    <div className="text-sm text-muted-foreground dark:text-gray-300 mt-1">
                                      <div className="font-medium dark:text-gray-100">{record.point}</div>
                                      <div className="text-xs dark:text-gray-400">{record.description}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Temperature (°C)</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={record.temperature}
                                      onChange={(e) => updateRecordingTemperature(index, parseFloat(e.target.value) || 0)}
                                      placeholder="Enter temperature"
                                      className="text-sm mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Auto Status</Label>
                                    <Badge 
                                      className={`mt-1 ${
                                        record.status === 'Normal' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600' :
                                        record.status === 'Warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600'
                                      }`}
                                    >
                                      {record.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-end">
                                    <div className="text-xs text-muted-foreground dark:text-gray-400 space-y-2">
                                      <div className="space-y-1">
                                        <div className="text-green-600 dark:text-green-400">Normal: ≤60°C</div>
                                        <div className="text-yellow-600 dark:text-yellow-400">Warning: 61-80°C</div>
                                        <div className="text-red-600 dark:text-red-400">Critical: &gt;80°C</div>
                                      </div>
                                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                        <div className="text-blue-600 dark:text-blue-400 font-medium">
                                          📅 Recording Date
                                        </div>
                                        <div className="text-xs">
                                          {format(new Date(), 'dd/MM/yyyy HH:mm')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )))
                              }
                              
                              {/* Recording Actions */}
                              <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
                                <Button
                                  onClick={cancelTemperatureRecording}
                                  variant="outline"
                                  className="flex-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                  disabled={isRecordingSubmitting}
                                >
                                  Cancel Recording
                                </Button>
                                <Button
                                  onClick={saveTemperatureRecording}
                                  className="flex-1 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                                  disabled={isRecordingSubmitting || recordingData.filter(record => record.temperature > 0).length === 0}
                                >
                                  {isRecordingSubmitting ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Saving...
                                    </>
                                  ) : (
                                    (() => {
                                      const recordsToSave = recordingData.filter(record => record.temperature > 0).length
                                      return recordsToSave > 0 
                                        ? `Save ${recordsToSave} Temperature Record${recordsToSave > 1 ? 's' : ''}`
                                        : 'Enter temperatures to save'
                                    })()
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

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

      {/* LRS Image Preview Modal */}
      <Dialog open={showLrsImageModal} onOpenChange={setShowLrsImageModal}>
        <DialogContent className="max-w-4xl w-full max-h-[95vh] p-0 dark:bg-gray-900">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 dark:text-gray-100">
              <Eye className="h-5 w-5" />
              LRS Equipment Preview Image
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative px-6 pb-6">
            <div className="relative w-full max-h-[70vh] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              {currentLrsImage && (
                <Image
                  src={currentLrsImage}
                  alt="LRS Equipment Preview"
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-[70vh] object-contain"
                  onError={(e) => {
                    console.error(`Failed to load LRS image: ${currentLrsImage}`, e)
                    e.currentTarget.src = '/placeholder.svg'
                  }}
                />
              )}
            </div>
            
            {/* Close Instructions */}
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Press ESC or click outside to close
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
