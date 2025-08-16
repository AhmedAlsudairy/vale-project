"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Thermometer, ChevronDown, ChevronRight, ChevronLeft, Save, Trash2, Edit, Image as ImageIcon, Upload, X, ZoomIn, ZoomOut, Maximize2, Download, RotateCw, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Combobox } from "@/components/ui/combobox"
import { exportLrsThermographyToExcel, exportSingleLrsSessionToExcel } from "@/lib/excel-utils"
import Image from "next/image"
import { CldImage } from 'next-cloudinary'

interface Equipment {
  id: number
  tagNo: string
  equipmentName: string
  equipmentType: string
}

interface TemperatureRecord {
  id?: number
  point: string
  description: string
  temperature: number
  status: 'Normal' | 'Warning' | 'Critical'
  inspector?: string
  remark?: string
  createdAt: Date
}

interface LrsSession {
  id: number
  tagNumber: string
  equipmentName: string
  equipmentType: string
  numberOfPoints: number
  date: string
  previewImage?: string
  images: string[] // Multiple images support
  createdAt: string
  updatedAt: string
  temperatureRecords: TemperatureRecord[]
}

const EQUIPMENT_TYPES = [
  'Liquid Resistor Starter',
  'Contactor', 
  'Cooler Fan'
]

const TEMPERATURE_STATUS = ['Normal', 'Warning', 'Critical']

const LRS_PREVIEW_IMAGES = [
  '/lrs-thermo/BO.3161.01.jpg',
  '/lrs-thermo/BO.3161.02.jpg',
  '/lrs-thermo/BO.3161.03.jpg',
  '/lrs-thermo/BO.3161.04.jpg',
  '/lrs-thermo/BO.3161.05.jpg'
]

export default function LrsThermographyPage() {
  const [sessions, setSessions] = useState<LrsSession[]>([])
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState<LrsSession | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())
  const [imageViewerState, setImageViewerState] = useState({
    currentImageIndex: 0,
    images: [] as string[],
    zoom: 1,
    rotation: 0,
    isFullscreen: false
  })
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    tagNumber: '',
    equipmentName: '',
    equipmentType: '',
    numberOfPoints: 1,
    previewImage: '',
    images: [] as string[] // Multiple images
  })
  
  const [isCreatingEquipment, setIsCreatingEquipment] = useState(false)

  // Temperature records state
  const [tempRecords, setTempRecords] = useState<TemperatureRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<TemperatureRecord | null>(null)
  const [globalInspector, setGlobalInspector] = useState('')

  useEffect(() => {
    fetchSessions()
    fetchEquipment()
    
    // Debug Cloudinary widget availability
    const checkCloudinaryWidget = () => {
      console.log('🔧 DEBUG - Checking Cloudinary availability:', {
        hasWindow: typeof window !== 'undefined',
        hasCloudinary: typeof window !== 'undefined' && !!(window as any).cloudinary,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'
      })
    }
    
    // Check immediately and after a short delay
    checkCloudinaryWidget()
    const timeoutId = setTimeout(checkCloudinaryWidget, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [])

  // Keyboard shortcuts for image viewer
  useEffect(() => {
    if (selectedImage !== 'viewer') return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          prevImage()
          break
        case 'ArrowRight':
          e.preventDefault()
          nextImage()
          break
        case '+':
        case '=':
          e.preventDefault()
          zoomIn()
          break
        case '-':
          e.preventDefault()
          zoomOut()
          break
        case '0':
          e.preventDefault()
          resetZoom()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          rotateImage()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'Escape':
          e.preventDefault()
          setSelectedImage(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, imageViewerState])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/lrs-sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast({
        title: "Error",
        description: "Failed to fetch sessions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment')
      if (response.ok) {
        const data = await response.json()
        setEquipmentList(data)
      }
    } catch (error) {
      console.error('Error fetching equipment:', error)
    }
  }

  const createEquipment = async (tagNumber: string, equipmentName?: string, equipmentType?: string) => {
    setIsCreatingEquipment(true)
    try {
      const newEquipment = {
        tagNo: tagNumber,
        equipmentName: equipmentName || tagNumber,
        equipmentType: equipmentType || 'Liquid Resistor Starter',
        location: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        installDate: '',
        status: 'Active'
      }

      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEquipment),
      })

      if (response.ok) {
        const createdEquipment = await response.json()
        setEquipmentList(prev => [...prev, createdEquipment])
        
        // Update form data with the new equipment
        setFormData(prev => ({
          ...prev,
          tagNumber: createdEquipment.tagNo,
          equipmentName: createdEquipment.equipmentName,
          equipmentType: createdEquipment.equipmentType
        }))
        
        toast({
          title: "Success",
          description: `Equipment ${tagNumber} created successfully`,
        })
        
        return createdEquipment
      } else {
        throw new Error('Failed to create equipment')
      }
    } catch (error) {
      console.error('Error creating equipment:', error)
      toast({
        title: "Error",
        description: "Failed to create equipment",
        variant: "destructive",
      })
      return null
    } finally {
      setIsCreatingEquipment(false)
    }
  }

  const handleEquipmentSelect = (tagNo: string) => {
    const equipment = equipmentList.find(eq => eq.tagNo === tagNo)
    if (equipment) {
      setFormData(prev => ({
        ...prev,
        tagNumber: equipment.tagNo,
        equipmentName: equipment.equipmentName,
        equipmentType: equipment.equipmentType
      }))
    }
  }

  // Image handling functions
  const handleImageUploadSuccess = (result: any) => {
    console.log('🔧 DEBUG - Upload successful:', result)
    const imageUrl = result.info?.secure_url || result.secure_url
    console.log('🔧 DEBUG - Extracted image URL:', imageUrl)
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }))
    toast({
      title: "Success",
      description: "Image uploaded successfully",
    })
  }

  const handleImageUploadError = (error: any) => {
    console.error('🔧 DEBUG - Upload error details:', error)
    toast({
      title: "Upload Failed", 
      description: `Upload error: ${error.message || 'Unknown error'}. Using preset 'first-folder'. Check your Cloudinary configuration.`,
      variant: "destructive"
    })
  }

  const testCloudinaryConnection = async () => {
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      
      console.log('🔧 DEBUG - Environment check:', {
        cloudName: cloudName || 'MISSING',
        presetName: 'first-folder',
        hasWindow: typeof window !== 'undefined',
        hasCloudinary: typeof window !== 'undefined' && !!(window as any).cloudinary
      })
      
      if (!cloudName) {
        toast({
          title: "Configuration Error",
          description: "Cloudinary cloud name not configured",
          variant: "destructive"
        })
        return
      }

      // Test if Cloudinary script is loaded
      if (typeof window !== 'undefined' && (window as any).cloudinary) {
        console.log('🔧 DEBUG - Cloudinary SDK loaded successfully')
        toast({
          title: "✅ Configuration Check",
          description: `Cloud: ${cloudName} | Cloudinary SDK: ✅ | Preset: 'first-folder'`,
        })
      } else {
        console.log('🔧 DEBUG - Cloudinary SDK not loaded, widget may not work')
        toast({
          title: "⚠️ SDK Issue",
          description: "Cloudinary SDK not loaded. Try refreshing the page or check your internet connection.",
          variant: "destructive"
        })
      }

      console.log('🔧 DEBUG - Test complete - unsigned uploads with preset "first-folder"')
    } catch (error) {
      console.error('🔧 DEBUG - Test error:', error)
      toast({
        title: "❌ Test Failed",
        description: "Error checking Cloudinary configuration. Check console for details.",
        variant: "destructive"
      })
    }
  }

  const createUploadPreset = async () => {
    toast({
      title: "ℹ️ Using Direct Upload",
      description: "Using direct upload to Cloudinary with 'first-folder' preset. No widget needed!",
    })
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const setAsPreviewImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      previewImage: imageUrl
    }))
  }

  // Enhanced Image Viewer Functions
  const openImageViewer = (images: string[], startIndex = 0) => {
    setImageViewerState({
      currentImageIndex: startIndex,
      images: images,
      zoom: 1,
      rotation: 0,
      isFullscreen: false
    })
    setSelectedImage('viewer')
  }

  const nextImage = () => {
    setImageViewerState(prev => ({
      ...prev,
      currentImageIndex: (prev.currentImageIndex + 1) % prev.images.length,
      zoom: 1,
      rotation: 0
    }))
  }

  const prevImage = () => {
    setImageViewerState(prev => ({
      ...prev,
      currentImageIndex: prev.currentImageIndex === 0 ? prev.images.length - 1 : prev.currentImageIndex - 1,
      zoom: 1,
      rotation: 0
    }))
  }

  const zoomIn = () => {
    setImageViewerState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.25, 3) }))
  }

  const zoomOut = () => {
    setImageViewerState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.25, 0.5) }))
  }

  const resetZoom = () => {
    setImageViewerState(prev => ({ ...prev, zoom: 1, rotation: 0 }))
  }

  const rotateImage = () => {
    setImageViewerState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))
  }

  const toggleFullscreen = () => {
    setImageViewerState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }))
  }

  const downloadImage = (imageUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const initializeTempRecords = (numberOfPoints: number) => {
    const records: TemperatureRecord[] = []
    for (let i = 1; i <= numberOfPoints; i++) {
      records.push({
        point: `Point ${i}`,
        description: `Temperature measurement point ${i}`,
        temperature: 0,
        status: 'Normal',
        inspector: globalInspector,
        remark: '',
        createdAt: new Date()
      })
    }
    setTempRecords(records)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingSession) {
      // Adding records to existing session
      if (tempRecords.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one temperature record",
          variant: "destructive",
        })
        return
      }

      try {
        // Add each temperature record to the existing session
        for (const record of tempRecords) {
          await fetch(`/api/lrs-sessions/${editingSession.id}/temperature-records`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
          })
        }
        
        toast({
          title: "Success",
          description: "Temperature records added successfully",
        })
        setShowForm(false)
        resetForm()
        fetchSessions()
      } catch (error) {
        console.error('Error adding temperature records:', error)
        toast({
          title: "Error",
          description: "Failed to add temperature records",
          variant: "destructive",
        })
      }
    } else {
      // Creating new session (without temperature records)
      if (!formData.tagNumber || !formData.equipmentName || !formData.numberOfPoints) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      try {
        // Create the session only
        const sessionPayload = {
          tagNumber: formData.tagNumber,
          equipmentName: formData.equipmentName,
          equipmentType: formData.equipmentType,
          numberOfPoints: formData.numberOfPoints,
          previewImage: formData.previewImage,
          images: formData.images
        }

        const sessionResponse = await fetch('/api/lrs-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sessionPayload)
        })

        if (sessionResponse.ok) {
          toast({
            title: "Success",
            description: "LRS session created successfully. You can now add temperature records.",
          })
          setShowForm(false)
          resetForm()
          fetchSessions()
        } else {
          const error = await sessionResponse.json()
          toast({
            title: "Error",
            description: error.error || "Failed to create session",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error creating session:', error)
        toast({
          title: "Error",
          description: "Failed to create session",
          variant: "destructive",
        })
      }
    }
  }

  const resetForm = () => {
    setFormData({
      tagNumber: '',
      equipmentName: '',
      equipmentType: '',
      numberOfPoints: 1,
      previewImage: '',
      images: []
    })
    setTempRecords([])
    setEditingSession(null)
    setGlobalInspector('')
  }

  // Function to determine temperature status based on temperature value
  const getTemperatureStatus = (temperature: number): 'Normal' | 'Warning' | 'Critical' => {
    if (temperature <= 60) return 'Normal'
    if (temperature <= 80) return 'Warning'
    return 'Critical'
  }

  const updateTempRecord = (index: number, field: keyof TemperatureRecord, value: any) => {
    setTempRecords(prev => prev.map((record, i) => {
      if (i === index) {
        const updatedRecord = { ...record, [field]: value }
        // Automatically update status when temperature changes
        if (field === 'temperature') {
          updatedRecord.status = getTemperatureStatus(parseFloat(value) || 0)
        }
        return updatedRecord
      }
      return record
    }))
  }

  // Function to apply global inspector to all records
  const applyGlobalInspector = (inspectorName: string) => {
    setGlobalInspector(inspectorName)
    setTempRecords(prev => prev.map(record => ({
      ...record,
      inspector: inspectorName
    })))
  }

  const addTempRecord = () => {
    const newRecord: TemperatureRecord = {
      point: `Point ${tempRecords.length + 1}`,
      description: `Temperature measurement point ${tempRecords.length + 1}`,
      temperature: 0,
      status: 'Normal',
      inspector: globalInspector,
      remark: '',
      createdAt: new Date()
    }
    setTempRecords(prev => [...prev, newRecord])
  }

  const removeTempRecord = (index: number) => {
    setTempRecords(prev => prev.filter((_, i) => i !== index))
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-green-500'
      case 'Warning': return 'bg-yellow-500'
      case 'Critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
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

  const deleteSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      const response = await fetch(`/api/lrs-sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Session deleted successfully",
        })
        fetchSessions()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete session",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">LRS Thermography</h1>
          <p className="text-gray-600 dark:text-gray-400">Liquid Resistor Starter Thermography Management</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => exportLrsThermographyToExcel(sessions)}
            variant="outline"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          {/* <Button 
            onClick={testCloudinaryConnection}
            variant="outline"
            size="sm"
          >
            Test Config
          </Button>
          <Button 
            onClick={createUploadPreset}
            variant="outline"
            size="sm"
          >
            Upload Info
          </Button> */}
          <Button 
            onClick={() => {
              setEditingSession(null) // Make sure we're in creation mode
              setShowForm(true)
              setTempRecords([]) // Clear any existing temp records
              setGlobalInspector('') // Reset global inspector
            }} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New LRS Session
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id} className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSessionExpansion(session.id)}
                  >
                    {expandedSessions.has(session.id) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </Button>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{session.tagNumber} - {session.equipmentName}</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Type: {session.equipmentType} | Points: {session.numberOfPoints} | 
                      Date: {new Date(session.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Multiple Images Preview */}
                  {(session.images && session.images.length > 0) || session.previewImage ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          View Images ({(session.images?.length || 0) + (session.previewImage && !session.images?.includes(session.previewImage) ? 1 : 0)})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>Images - {session.tagNumber}</DialogTitle>
                          <DialogDescription>
                            Thermography images for {session.equipmentName} • Click any image to view in enhanced viewer
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-4 max-h-[70vh] overflow-y-auto">
                          {/* Show uploaded images */}
                          {session.images && session.images.map((imageUrl, index) => (
                            <div 
                              key={`uploaded-${index}`} 
                              className="relative group cursor-pointer hover:scale-105 transition-transform duration-200"
                              onClick={() => {
                                const allImages = [
                                  ...(session.images || []),
                                  ...(session.previewImage && (!session.images || !session.images.includes(session.previewImage)) ? [session.previewImage] : [])
                                ]
                                openImageViewer(allImages, index)
                              }}
                            >
                              <CldImage
                                src={imageUrl}
                                alt={`${session.tagNumber} Image ${index + 1}`}
                                width={300}
                                height={200}
                                className="w-full h-32 sm:h-40 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                              />
                              
                              {/* Overlay with zoom icon */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              
                              {/* Image info */}
                              <div className="absolute bottom-2 left-2 right-2">
                                {session.previewImage === imageUrl && (
                                  <Badge className="text-xs mb-1">
                                    Preview
                                  </Badge>
                                )}
                                <p className="text-xs text-white bg-black bg-opacity-50 rounded px-2 py-1">
                                  Image {index + 1}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Show legacy preview image if it's not in the uploaded images */}
                          {session.previewImage && (!session.images || !session.images.includes(session.previewImage)) && (
                            <div 
                              className="relative group cursor-pointer hover:scale-105 transition-transform duration-200"
                              onClick={() => {
                                const allImages = [
                                  ...(session.images || []),
                                  session.previewImage!
                                ]
                                openImageViewer(allImages, session.images?.length || 0)
                              }}
                            >
                              <Image
                                src={session.previewImage}
                                alt={`Preview for ${session.tagNumber}`}
                                width={300}
                                height={200}
                                className="w-full h-32 sm:h-40 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                              />
                              
                              {/* Overlay with zoom icon */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              
                              {/* Legacy badge */}
                              <div className="absolute bottom-2 left-2 right-2">
                                <Badge className="text-xs mb-1">
                                  Preview (Legacy)
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <Collapsible open={expandedSessions.has(session.id)}>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-4">
                    <Separator />
                    <h4 className="text-lg font-semibold flex items-center justify-between text-gray-900 dark:text-gray-100">
                      <div className="flex items-center">
                        <Thermometer className="mr-2 h-5 w-5" />
                        Temperature Records ({session.temperatureRecords.length})
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportSingleLrsSessionToExcel(session)}
                          title="Export this session to Excel"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Excel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingSession(session)
                            setFormData({
                              tagNumber: session.tagNumber,
                              equipmentName: session.equipmentName,
                              equipmentType: session.equipmentType,
                              numberOfPoints: session.numberOfPoints,
                              previewImage: session.previewImage || '',
                              images: session.images || []
                            })
                            // Reset global inspector
                            setGlobalInspector('')
                            // Initialize records based on numberOfPoints
                            initializeTempRecords(session.numberOfPoints)
                            setShowForm(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Record
                        </Button>
                      </div>
                    </h4>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Point</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Temperature (°C)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Inspector</TableHead>
                          <TableHead>Remark</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {session.temperatureRecords.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">{record.point}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">{record.description}</TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100 font-medium">{record.temperature}°C</TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(record.status)}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">{record.inspector || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground dark:text-gray-400">{record.remark || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground dark:text-gray-400">
                              {new Date(record.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* New Session Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? `Add Temperature Records - ${editingSession.tagNumber}` : 'New LRS Thermography Session'}
            </DialogTitle>
            <DialogDescription>
              {editingSession 
                ? 'Add new temperature measurement records to this session'
                : 'Create a new thermography session for Liquid Resistor Starter equipment'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Equipment Information - Only show when creating new session */}
            {!editingSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Equipment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tagNumber" className="text-gray-900 dark:text-gray-100 font-medium">Tag Number *</Label>
                      <Combobox
                        value={formData.tagNumber}
                        onValueChange={(value: string) => {
                          const equipment = equipmentList.find(eq => eq.tagNo === value)
                          if (equipment) {
                            // Existing equipment selected
                            handleEquipmentSelect(value)
                          } else {
                            // New tag number entered
                            setFormData(prev => ({
                              ...prev,
                              tagNumber: value,
                              equipmentName: value, // Default to tag number
                              equipmentType: 'Liquid Resistor Starter' // Default type
                            }))
                          }
                        }}
                        allowCustom={true}
                        onAddNew={async (newTagNumber: string) => {
                          await createEquipment(newTagNumber)
                        }}
                        placeholder="Select or enter tag number"
                        emptyText="No equipment found"
                        options={equipmentList.map(equipment => ({
                          value: equipment.tagNo,
                          label: `${equipment.tagNo} - ${equipment.equipmentName}`
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="equipmentName" className="text-gray-900 dark:text-gray-100 font-medium">Equipment Name *</Label>
                      <Input
                        id="equipmentName"
                        value={formData.equipmentName}
                        onChange={(e) => setFormData(prev => ({ ...prev, equipmentName: e.target.value }))}
                        placeholder="Enter equipment name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="equipmentType" className="text-gray-900 dark:text-gray-100 font-medium">Equipment Type *</Label>
                      <Select 
                        value={formData.equipmentType} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, equipmentType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EQUIPMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="numberOfPoints" className="text-gray-900 dark:text-gray-100 font-medium">Number of Points *</Label>
                      <Input
                        id="numberOfPoints"
                        type="number"
                        min="1"
                        max="50"
                        value={formData.numberOfPoints}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1
                          setFormData(prev => ({ ...prev, numberOfPoints: value }))
                          initializeTempRecords(value)
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <Label className="text-base font-semibold mb-4 block text-gray-900 dark:text-gray-100">Images</Label>
                    
                    {/* Direct Upload */}
                    <div className="mb-4 space-y-4">
                      <div className="text-center text-sm text-muted-foreground dark:text-gray-400">
                        <span>Direct upload to Cloudinary:</span>
                      </div>
                      
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length === 0) return

                          console.log('🔧 DEBUG - Direct upload attempt with files:', files.length)
                          
                          // Show loading toast
                          toast({
                            title: "Uploading...",
                            description: `Uploading ${files.length} file(s) to Cloudinary`,
                          })
                          
                          for (const file of files) {
                            try {
                              const formData = new FormData()
                              formData.append('file', file)
                              formData.append('upload_preset', 'first-folder')
                              formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '')

                              console.log('🔧 DEBUG - Uploading file directly:', file.name)

                              const response = await fetch(
                                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                                {
                                  method: 'POST',
                                  body: formData,
                                }
                              )

                              if (response.ok) {
                                const result = await response.json()
                                console.log('🔧 DEBUG - Direct upload successful:', result)
                                handleImageUploadSuccess(result)
                              } else {
                                const error = await response.json()
                                console.error('🔧 DEBUG - Direct upload failed:', error)
                                toast({
                                  title: "Upload Failed",
                                  description: `Failed to upload ${file.name}: ${error.error?.message || 'Unknown error'}`,
                                  variant: "destructive"
                                })
                              }
                            } catch (error) {
                              console.error('🔧 DEBUG - Direct upload error:', error)
                              toast({
                                title: "Upload Error",
                                description: `Error uploading ${file.name}. Check console for details.`,
                                variant: "destructive"
                              })
                            }
                          }
                          
                          // Clear the input
                          e.target.value = ''
                        }}
                        className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      />
                      
                      <p className="text-xs text-muted-foreground dark:text-gray-400 text-center">
                        Upload up to 10 images (JPG, PNG, WebP) • Max 5MB each<br/>
                        <span className="text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => {
                          setSelectedImage('troubleshooting')
                        }}>
                          📋 Troubleshooting Guide
                        </span>
                      </p>
                    </div>

                    {/* Image Gallery */}
                    {formData.images.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Uploaded Images ({formData.images.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {formData.images.map((imageUrl, index) => (
                            <div key={index} className="relative group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              <CldImage
                                src={imageUrl}
                                alt={`LRS Image ${index + 1}`}
                                width={250}
                                height={180}
                                className="w-full h-28 sm:h-32 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                onClick={() => openImageViewer(formData.images, index)}
                              />
                              
                              {/* Enhanced Image Actions */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-wrap justify-center">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openImageViewer(formData.images, index)
                                    }}
                                    className="text-xs h-7 px-2"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setAsPreviewImage(imageUrl)
                                    }}
                                    className="text-xs h-7 px-2"
                                  >
                                    Preview
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      downloadImage(imageUrl, `LRS-Image-${index + 1}.jpg`)
                                    }}
                                    className="text-xs h-7 px-2"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeImage(index)
                                    }}
                                    className="text-xs h-7 px-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Preview Badge */}
                              {formData.previewImage === imageUrl && (
                                <Badge className="absolute top-2 left-2 text-xs bg-blue-500">
                                  Preview
                                </Badge>
                              )}
                              
                              {/* Image Number */}
                              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy Image Selection (fallback) */}
                    {formData.images.length === 0 && (
                      <div className="mt-4">
                        <Label htmlFor="previewImage" className="text-sm font-medium dark:text-gray-100">Or select from preset images</Label>
                        <Select 
                          value={formData.previewImage} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, previewImage: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select preset image" />
                          </SelectTrigger>
                          <SelectContent>
                            {LRS_PREVIEW_IMAGES.map((imagePath) => (
                              <SelectItem key={imagePath} value={imagePath}>
                                {imagePath.split('/').pop()?.replace('.jpg', '')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.previewImage && !formData.images.includes(formData.previewImage) && (
                          <div className="mt-2">
                            <Image
                              src={formData.previewImage}
                              alt="Preview"
                              width={200}
                              height={150}
                              className="rounded border"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Temperature Records - Only show when adding records to existing session */}
            {editingSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Temperature Records
                    <Button type="button" size="sm" onClick={addTempRecord}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Enter temperature measurements for each point
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Global Inspector Field */}
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-center gap-4">
                        <Label htmlFor="globalInspector" className="text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                          Inspector Name (applies to all points):
                        </Label>
                        <Input
                          id="globalInspector"
                          value={globalInspector}
                          onChange={(e) => applyGlobalInspector(e.target.value)}
                          placeholder="Enter inspector name for all measurements"
                          className="flex-1"
                        />
                      </div>
                    </Card>

                    {/* Temperature Status Info */}
                    <Card className="p-3 bg-yellow-50 border-yellow-200">
                      <div className="text-sm text-yellow-800">
                        <strong>Temperature Status Guide:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• <strong>Normal:</strong> ≤ 60°C</li>
                          <li>• <strong>Warning:</strong> 61-80°C</li>
                          <li>• <strong>Critical:</strong> &gt; 80°C</li>
                        </ul>
                        <p className="mt-2 text-xs">Status is automatically determined based on temperature value</p>
                      </div>
                    </Card>

                    {tempRecords.map((record, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 flex-1">
                            <div>
                              <Label className="text-gray-900 dark:text-gray-100 font-medium">Point</Label>
                              <Input
                                value={record.point}
                                onChange={(e) => updateTempRecord(index, 'point', e.target.value)}
                                placeholder="Point name"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-900 dark:text-gray-100 font-medium">Description</Label>
                              <Input
                                value={record.description}
                                onChange={(e) => updateTempRecord(index, 'description', e.target.value)}
                                placeholder="Description"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-900 dark:text-gray-100 font-medium">Temperature (°C)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={record.temperature}
                                onChange={(e) => updateTempRecord(index, 'temperature', parseFloat(e.target.value) || 0)}
                                placeholder="0.0"
                              />
                            </div>
                            <div>
                              <Label className="font-medium dark:text-gray-100">Status</Label>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  className={`${getStatusBadgeColor(record.status)} text-white px-3 py-1`}
                                >
                                  {record.status}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">(Auto-determined)</span>
                              </div>
                            </div>
                            <div className="md:col-span-2 lg:col-span-1">
                              <Label className="font-medium dark:text-gray-100">Remark (Optional)</Label>
                              <Input
                                value={record.remark || ''}
                                onChange={(e) => updateTempRecord(index, 'remark', e.target.value)}
                                placeholder="Add optional remark..."
                                className="text-sm"
                              />
                            </div>
                          </div>
                          {tempRecords.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTempRecord(index)}
                              className="ml-2 mt-6"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowForm(false)
                resetForm()
              }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                {editingSession ? 'Add Temperature Records' : 'Create Session'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enhanced Image Viewer Modal */}
      <Dialog open={selectedImage === 'viewer'} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className={`${imageViewerState.isFullscreen ? 'max-w-full max-h-full w-screen h-screen' : 'max-w-5xl max-h-[95vh]'} p-0 overflow-hidden`}>
          <div className="relative w-full h-full flex flex-col bg-black">
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold">
                    Image {imageViewerState.currentImageIndex + 1} of {imageViewerState.images.length}
                  </h3>
                  <span className="text-sm opacity-75">
                    Zoom: {Math.round(imageViewerState.zoom * 100)}% | 
                    Rotation: {imageViewerState.rotation}°
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={zoomOut}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetZoom}
                    className="text-white hover:bg-white/20 text-xs px-3"
                  >
                    Reset
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={zoomIn}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={rotateImage}
                    className="text-white hover:bg-white/20"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadImage(imageViewerState.images[imageViewerState.currentImageIndex], `LRS-Image-${imageViewerState.currentImageIndex + 1}.jpg`)}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImage(null)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Image Container */}
            <div className="flex-1 flex items-center justify-center p-4 pt-16 overflow-hidden">
              <div 
                className="relative transition-transform duration-200 cursor-move select-none"
                style={{
                  transform: `scale(${imageViewerState.zoom}) rotate(${imageViewerState.rotation}deg)`,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                {imageViewerState.images.length > 0 && imageViewerState.images[imageViewerState.currentImageIndex] && (
                  imageViewerState.images[imageViewerState.currentImageIndex].includes('cloudinary') ? (
                    <CldImage
                      src={imageViewerState.images[imageViewerState.currentImageIndex]}
                      alt={`Image ${imageViewerState.currentImageIndex + 1}`}
                      width={800}
                      height={600}
                      className="max-w-full max-h-full object-contain"
                      quality="auto"
                      format="auto"
                    />
                  ) : (
                    <Image
                      src={imageViewerState.images[imageViewerState.currentImageIndex]}
                      alt={`Image ${imageViewerState.currentImageIndex + 1}`}
                      width={800}
                      height={600}
                      className="max-w-full max-h-full object-contain"
                    />
                  )
                )}
              </div>
            </div>

            {/* Navigation Controls */}
            {imageViewerState.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-colors z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-colors z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Bottom Thumbnails */}
            {imageViewerState.images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex justify-center space-x-2 overflow-x-auto max-w-full">
                  {imageViewerState.images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className={`relative flex-shrink-0 cursor-pointer border-2 rounded transition-all ${
                        index === imageViewerState.currentImageIndex ? 'border-blue-400 scale-110' : 'border-white/30 hover:border-white/60'
                      }`}
                      onClick={() => setImageViewerState(prev => ({ ...prev, currentImageIndex: index, zoom: 1, rotation: 0 }))}
                    >
                      {imageUrl.includes('cloudinary') ? (
                        <CldImage
                          src={imageUrl}
                          alt={`Thumbnail ${index + 1}`}
                          width={80}
                          height={60}
                          className="w-16 h-12 object-cover rounded"
                        />
                      ) : (
                        <Image
                          src={imageUrl}
                          alt={`Thumbnail ${index + 1}`}
                          width={80}
                          height={60}
                          className="w-16 h-12 object-cover rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Help */}
            <div className="absolute top-20 right-4 text-white text-xs bg-black/50 rounded p-2 opacity-50 hover:opacity-100 transition-opacity">
              <div className="space-y-1">
                <div>← → Navigate</div>
                <div>+ - Zoom</div>
                <div>R Rotate</div>
                <div>F Fullscreen</div>
                <div>Esc Close</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Troubleshooting Modal */}
      <Dialog open={selectedImage === 'troubleshooting'} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>🔧 Cloudinary Upload Troubleshooting</DialogTitle>
            <DialogDescription>
              Having issues with image uploads? Here's how to fix common problems:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">1. Upload widget opens but shows no file browser</h4>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Upload preset 'first-folder' issue</li>
                <li>• Click "Test Cloudinary" button to check configuration</li>
                <li>• Check browser console for detailed error messages</li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">2. Manual Setup (if auto-create fails)</h4>
              <ol className="text-sm text-yellow-700 space-y-1 ml-4">
                <li>1. Go to: https://console.cloudinary.com/console/c-djx4ybbtb/settings/upload</li>
                <li>2. Click "Upload presets" tab</li>
                <li>3. Click "Add upload preset"</li>
                <li>4. Set these values:</li>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>- Preset name: <code className="bg-gray-200 px-1">first-folder</code></li>
                  <li>- Upload mode: <code className="bg-gray-200 px-1">Unsigned</code></li>
                  <li>- Folder: <code className="bg-gray-200 px-1">(optional)</code></li>
                </ul>
                <li>5. Click "Save"</li>
              </ol>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">3. Environment Variables</h4>
              <p className="text-sm text-green-700">Current config:</p>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                Cloud Name: djx4ybbtb ✅<br/>
                API Key: 873313952483978 ✅<br/>
                API Secret: [Hidden] ✅
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">4. Still not working?</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Open browser console (F12) to see detailed errors</li>
                <li>• Check if Cloudinary account has reached upload limits</li>
                <li>• Try refreshing the page</li>
                <li>• Use the fallback file input as temporary workaround</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
