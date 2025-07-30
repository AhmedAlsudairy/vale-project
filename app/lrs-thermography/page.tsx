"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Thermometer, Eye, ChevronDown, ChevronRight, Save, Trash2, Edit, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Combobox } from "@/components/ui/combobox"
import Image from "next/image"

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
}

interface LrsSession {
  id: number
  tagNumber: string
  equipmentName: string
  equipmentType: string
  numberOfPoints: number
  date: string
  previewImage?: string
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
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    tagNumber: '',
    equipmentName: '',
    equipmentType: '',
    numberOfPoints: 1,
    previewImage: ''
  })
  
  const [isCreatingEquipment, setIsCreatingEquipment] = useState(false)

  // Temperature records state
  const [tempRecords, setTempRecords] = useState<TemperatureRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<TemperatureRecord | null>(null)

  useEffect(() => {
    fetchSessions()
    fetchEquipment()
  }, [])

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

  const initializeTempRecords = (numberOfPoints: number) => {
    const records: TemperatureRecord[] = []
    for (let i = 1; i <= numberOfPoints; i++) {
      records.push({
        point: `Point ${i}`,
        description: `Temperature measurement point ${i}`,
        temperature: 0,
        status: 'Normal',
        inspector: ''
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
          previewImage: formData.previewImage
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
      previewImage: ''
    })
    setTempRecords([])
    setEditingSession(null)
  }

  const updateTempRecord = (index: number, field: keyof TemperatureRecord, value: any) => {
    setTempRecords(prev => prev.map((record, i) => 
      i === index ? { ...record, [field]: value } : record
    ))
  }

  const addTempRecord = () => {
    const newRecord: TemperatureRecord = {
      point: `Point ${tempRecords.length + 1}`,
      description: `Temperature measurement point ${tempRecords.length + 1}`,
      temperature: 0,
      status: 'Normal',
      inspector: ''
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
          <h1 className="text-3xl font-bold">LRS Thermography</h1>
          <p className="text-gray-600">Liquid Resistor Starter Thermography Management</p>
        </div>
        <Button 
          onClick={() => {
            setEditingSession(null) // Make sure we're in creation mode
            setShowForm(true)
            setTempRecords([]) // Clear any existing temp records
          }} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New LRS Session
        </Button>
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
                    <CardTitle className="text-lg">{session.tagNumber} - {session.equipmentName}</CardTitle>
                    <CardDescription>
                      Type: {session.equipmentType} | Points: {session.numberOfPoints} | 
                      Date: {new Date(session.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {session.previewImage && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Preview Image - {session.tagNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center">
                          <Image
                            src={session.previewImage}
                            alt={`Preview for ${session.tagNumber}`}
                            width={800}
                            height={600}
                            className="max-w-full h-auto"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
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
                    <h4 className="text-lg font-semibold flex items-center justify-between">
                      <div className="flex items-center">
                        <Thermometer className="mr-2 h-5 w-5" />
                        Temperature Records ({session.temperatureRecords.length})
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingSession(session)
                          setFormData({
                            tagNumber: session.tagNumber,
                            equipmentName: session.equipmentName,
                            equipmentType: session.equipmentType,
                            numberOfPoints: session.numberOfPoints,
                            previewImage: session.previewImage || ''
                          })
                          // Initialize records based on numberOfPoints
                          initializeTempRecords(session.numberOfPoints)
                          setShowForm(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Record
                      </Button>
                    </h4>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Point</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Temperature (°C)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Inspector</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {session.temperatureRecords.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{record.point}</TableCell>
                            <TableCell>{record.description}</TableCell>
                            <TableCell>{record.temperature}°C</TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(record.status)}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.inspector || '-'}</TableCell>
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
                  <CardTitle className="text-lg">Equipment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tagNumber">Tag Number *</Label>
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
                      <Label htmlFor="equipmentName">Equipment Name *</Label>
                      <Input
                        id="equipmentName"
                        value={formData.equipmentName}
                        onChange={(e) => setFormData(prev => ({ ...prev, equipmentName: e.target.value }))}
                        placeholder="Enter equipment name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="equipmentType">Equipment Type *</Label>
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
                      <Label htmlFor="numberOfPoints">Number of Points *</Label>
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

                  <div>
                    <Label htmlFor="previewImage">Preview Image</Label>
                    <Select 
                      value={formData.previewImage} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, previewImage: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select preview image" />
                      </SelectTrigger>
                      <SelectContent>
                        {LRS_PREVIEW_IMAGES.map((imagePath) => (
                          <SelectItem key={imagePath} value={imagePath}>
                            {imagePath.split('/').pop()?.replace('.jpg', '')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.previewImage && (
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
                    {tempRecords.map((record, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
                            <div>
                              <Label>Point</Label>
                              <Input
                                value={record.point}
                                onChange={(e) => updateTempRecord(index, 'point', e.target.value)}
                                placeholder="Point name"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input
                                value={record.description}
                                onChange={(e) => updateTempRecord(index, 'description', e.target.value)}
                                placeholder="Description"
                              />
                            </div>
                            <div>
                              <Label>Temperature (°C)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={record.temperature}
                                onChange={(e) => updateTempRecord(index, 'temperature', parseFloat(e.target.value) || 0)}
                                placeholder="0.0"
                              />
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Select 
                                value={record.status} 
                                onValueChange={(value) => updateTempRecord(index, 'status', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TEMPERATURE_STATUS.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Inspector</Label>
                              <Input
                                value={record.inspector || ''}
                                onChange={(e) => updateTempRecord(index, 'inspector', e.target.value)}
                                placeholder="Inspector name"
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
    </div>
  )
}
