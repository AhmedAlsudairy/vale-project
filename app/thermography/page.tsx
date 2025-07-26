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
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTempStatus, setSelectedTempStatus] = useState('all')
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
          
          // RDI Measurements (°C)
          'RDI-68 (°C)': record.rdi68 || '-',
          'RDI-69 (°C)': record.rdi69 || '-',
          'RDI-70 (°C)': record.rdi70 || '-',
          
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
            record.scrCoolingFinsTemp || 0,
            record.rdi68 || 0,
            record.rdi69 || 0,
            record.rdi70 || 0
          ) || '-',
          'Temperature Status': (() => {
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
              r.mccbCOg2 || 0, r.mccbBodyTemp || 0, r.scrCoolingFinsTemp || 0,
              r.rdi68 || 0, r.rdi69 || 0, r.rdi70 || 0
            )
            return maxTemp > 80
          }).length, 0) },
        { 'Summary': 'Warning Temperature Records', 'Value': sessionsToExport.reduce((sum, s) => 
          sum + s.transformerRecords.filter(r => {
            const maxTemp = Math.max(
              r.mccbIcRPhase || 0, r.mccbIcBPhase || 0, r.mccbCOg1 || 0, 
              r.mccbCOg2 || 0, r.mccbBodyTemp || 0, r.scrCoolingFinsTemp || 0,
              r.rdi68 || 0, r.rdi69 || 0, r.rdi70 || 0
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
    <div className="container mx-auto p-3 sm:p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
              <Thermometer className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-500 flex-shrink-0" />
              <span className="truncate">ESP MCC Thermography</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Step-by-step temperature monitoring for ESP transformers (TF1, TF2, TF3)
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
          <Button onClick={() => setShowForm(true)} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">New </span>ESP Session
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
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
                  <Card key={transformer.transformerNo} className="p-3 sm:p-4">
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
                        <Label className="text-xs sm:text-sm font-medium">RDI-68 (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.rdi68}
                          onChange={(e) => updateTransformerField(transformerIndex, 'rdi68', e.target.value)}
                          placeholder="Temperature"
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">RDI-69 (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.rdi69}
                          onChange={(e) => updateTransformerField(transformerIndex, 'rdi69', e.target.value)}
                          placeholder="Temperature"
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">RDI-70 (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={transformer.rdi70}
                          onChange={(e) => updateTransformerField(transformerIndex, 'rdi70', e.target.value)}
                          placeholder="Temperature"
                          className="text-sm"
                        />
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
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingSession ? 'Update ESP Session' : 'Save ESP Session'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
                            record.scrCoolingFinsTemp || 0,
                            record.rdi68 || 0,
                            record.rdi69 || 0,
                            record.rdi70 || 0
                          )
                          const status = getTemperatureStatus(maxTemp)
                          
                          return (
                            <Card key={record.id} className="p-3">
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
                                  <span className="text-muted-foreground">RDI-68:</span>
                                  <div className="font-medium">{record.rdi68 ? `${record.rdi68}°C` : '-'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">RDI-69:</span>
                                  <div className="font-medium">{record.rdi69 ? `${record.rdi69}°C` : '-'}</div>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">RDI-70:</span>
                                  <div className="font-medium">{record.rdi70 ? `${record.rdi70}°C` : '-'}</div>
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
                              <TableHead className="text-xs">RDI-68</TableHead>
                              <TableHead className="text-xs">RDI-69</TableHead>
                              <TableHead className="text-xs">RDI-70</TableHead>
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
                                  <TableCell className="text-xs">{record.rdi68 ? `${record.rdi68}°C` : '-'}</TableCell>
                                  <TableCell className="text-xs">{record.rdi69 ? `${record.rdi69}°C` : '-'}</TableCell>
                                  <TableCell className="text-xs">{record.rdi70 ? `${record.rdi70}°C` : '-'}</TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {session.remarks && (
                        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-muted rounded-lg">
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
    </div>
  )
}
