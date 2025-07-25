"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Plus, ArrowLeft, Edit, Wrench, Zap, Calendar, MapPin, Download } from "lucide-react"
import Link from "next/link"
import { EquipmentForm } from "@/components/equipment-form"

interface Equipment {
  id: number
  tagNo: string
  equipmentName: string
  equipmentType: string
  location?: string
  installationDate?: string
  qrCode?: string
  createdAt: string
}

interface CarbonBrushRecord {
  id: number
  tagNo: string
  inspectionDate: string
  brushType: string
  workOrderNo?: string
  doneBy?: string
  remarks?: string
}

interface WindingResistanceRecord {
  id: number
  motorNo: string
  inspectionDate: string
  polarizationIndex?: number
  doneBy?: string
  remarks?: string
}

export default function EquipmentDetailPage() {
  const params = useParams()
  const equipmentId = params.id as string

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [carbonBrushRecords, setCarbonBrushRecords] = useState<CarbonBrushRecord[]>([])
  const [windingRecords, setWindingRecords] = useState<WindingResistanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)

  useEffect(() => {
    if (equipmentId) {
      fetchEquipmentDetails()
    }
  }, [equipmentId])

  const fetchEquipmentDetails = async () => {
    try {
      // Fetch equipment details
      const equipmentResponse = await fetch(`/api/equipment/${equipmentId}`)
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json()
        setEquipment(equipmentData)

        // Fetch related carbon brush records
        const carbonResponse = await fetch(`/api/carbon-brush?tagNo=${equipmentData.tagNo}`)
        if (carbonResponse.ok) {
          const carbonData = await carbonResponse.json()
          setCarbonBrushRecords(carbonData)
        }

        // Fetch related winding resistance records
        const windingResponse = await fetch(`/api/winding-resistance?motorNo=${equipmentData.tagNo}`)
        if (windingResponse.ok) {
          const windingData = await windingResponse.json()
          setWindingRecords(windingData)
        }
      }
    } catch (error) {
      console.error("Error fetching equipment details:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async () => {
    if (!equipment) return

    try {
      const response = await fetch(`/api/equipment/${equipment.id}/qr`, {
        method: "POST",
      })
      if (response.ok) {
        await fetchEquipmentDetails()
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const downloadQRCode = () => {
    if (!equipment?.qrCode) return

    const link = document.createElement("a")
    link.download = `equipment-${equipment.tagNo}-qr.png`
    link.href = equipment.qrCode
    link.click()
  }

  const handleEditSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchEquipmentDetails()
        setShowEditForm(false)
      }
    } catch (error) {
      console.error("Error updating equipment:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading equipment details...</div>
        </div>
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Equipment not found.</p>
          <Link href="/equipment">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Equipment
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/equipment">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{equipment.tagNo}</h1>
          <p className="text-muted-foreground text-lg">{equipment.equipmentName}</p>
        </div>
        <Button onClick={() => setShowEditForm(true)} variant="outline">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tag Number</p>
                  <p className="text-lg">{equipment.tagNo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Equipment Type</p>
                  <Badge variant="secondary">{equipment.equipmentType}</Badge>
                </div>
              </div>

              {equipment.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{equipment.location}</span>
                </div>
              )}

              {equipment.installationDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Installed: {new Date(equipment.installationDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="carbon-brush" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="carbon-brush" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Carbon Brush ({carbonBrushRecords.length})
              </TabsTrigger>
              <TabsTrigger value="winding" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Winding Resistance ({windingRecords.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="carbon-brush" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Carbon Brush Records</h3>
                <Link href={`/carbon-brush?equipment=${equipment.tagNo}`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                </Link>
              </div>

              {carbonBrushRecords.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No carbon brush records found.</p>
                    <Link href={`/carbon-brush?equipment=${equipment.tagNo}`}>
                      <Button className="mt-4">Add First Record</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {carbonBrushRecords.map((record) => (
                    <Card key={record.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{record.brushType}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(record.inspectionDate).toLocaleDateString()}
                              </span>
                            </div>
                            {record.workOrderNo && (
                              <p className="text-sm">WO: {record.workOrderNo}</p>
                            )}
                            {record.doneBy && (
                              <p className="text-sm">By: {record.doneBy}</p>
                            )}
                            {record.remarks && (
                              <p className="text-sm text-muted-foreground">{record.remarks}</p>
                            )}
                          </div>
                          <Link href={`/carbon-brush/${record.id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="winding" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Winding Resistance Records</h3>
                <Link href={`/winding-resistance?equipment=${equipment.tagNo}`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                </Link>
              </div>

              {windingRecords.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No winding resistance records found.</p>
                    <Link href={`/winding-resistance?equipment=${equipment.tagNo}`}>
                      <Button className="mt-4">Add First Record</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {windingRecords.map((record) => (
                    <Card key={record.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {new Date(record.inspectionDate).toLocaleDateString()}
                              </span>
                              {record.polarizationIndex && (
                                <Badge variant="outline">PI: {record.polarizationIndex}</Badge>
                              )}
                            </div>
                            {record.doneBy && (
                              <p className="text-sm">By: {record.doneBy}</p>
                            )}
                            {record.remarks && (
                              <p className="text-sm text-muted-foreground">{record.remarks}</p>
                            )}
                          </div>
                          <Link href={`/winding-resistance/${record.id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                QR Code
                <div className="flex gap-2">
                  {equipment.qrCode && (
                    <Button onClick={downloadQRCode} size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  {!equipment.qrCode && (
                    <Button onClick={generateQRCode} size="sm">
                      Generate
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {equipment.qrCode ? (
                <div className="text-center space-y-4">
                  <img
                    src={equipment.qrCode}
                    alt="Equipment QR Code"
                    className="w-full max-w-[200px] mx-auto border rounded"
                  />
                  <p className="text-xs text-muted-foreground">
                    Scan to quickly access this equipment
                  </p>
                  <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No QR code generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/carbon-brush?equipment=${equipment.tagNo}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Wrench className="w-4 h-4 mr-2" />
                  Add Carbon Brush Record
                </Button>
              </Link>
              <Link href={`/winding-resistance?equipment=${equipment.tagNo}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="w-4 h-4 mr-2" />
                  Add Winding Resistance Record
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <EquipmentForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleEditSubmit}
        initialData={equipment}
      />
    </div>
  )
}
