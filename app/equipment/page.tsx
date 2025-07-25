"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Plus, Search, Wrench, Zap, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { EquipmentForm } from "@/components/equipment-form"
import { QRScanner } from "@/components/qr-scanner"
import Link from "next/link"

interface Equipment {
  id: number
  tagNo: string
  equipmentName: string
  equipmentType: string
  location?: string
  installationDate?: string
  qrCode?: string
  createdAt: string
  carbonBrushCount?: number
  windingResistanceCount?: number
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchEquipment()
  }, [])

  useEffect(() => {
    const filtered = equipment.filter(
      (item) =>
        item.tagNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipmentType.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredEquipment(filtered)
  }, [equipment, searchTerm])

  const fetchEquipment = async () => {
    try {
      const response = await fetch("/api/equipment")
      const data = await response.json()
      setEquipment(data)
      setFilteredEquipment(data)
    } catch (error) {
      console.error("Error fetching equipment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchEquipment()
        setShowForm(false)
      }
    } catch (error) {
      console.error("Error creating equipment:", error)
    }
  }

  const handleQRScan = (data: string) => {
    // Parse QR data - could be equipment tag or record URL
    try {
      const url = new URL(data)
      const pathParts = url.pathname.split("/")
      
      if (pathParts.includes("equipment")) {
        const tagNo = pathParts[pathParts.indexOf("equipment") + 1]
        const foundEquipment = equipment.find(e => e.tagNo === tagNo)
        if (foundEquipment) {
          // Navigate to equipment details
          window.location.href = `/equipment/${foundEquipment.id}`
        }
      }
    } catch {
      // Try to find equipment by tag number directly
      const foundEquipment = equipment.find(e => e.tagNo === data)
      if (foundEquipment) {
        window.location.href = `/equipment/${foundEquipment.id}`
      }
    }
  }

  const generateQRCode = async (equipmentId: number) => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/qr`, {
        method: "POST",
      })
      if (response.ok) {
        await fetchEquipment()
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const downloadQRCode = (equipment: Equipment) => {
    if (!equipment.qrCode) return

    const link = document.createElement("a")
    link.download = `equipment-${equipment.tagNo}-qr.png`
    link.href = equipment.qrCode
    link.click()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading equipment...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground">
            Manage motor equipment with QR codes for easy access
          </p>
        </div>
        <div className="flex gap-2">
          <QRScanner onScan={handleQRScan} />
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by tag number, name, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{item.tagNo}</CardTitle>
                  <CardDescription className="font-medium">
                    {item.equipmentName}
                  </CardDescription>
                </div>
                {item.qrCode ? (
                  <div className="flex flex-col items-center space-y-2">
                    <img
                      src={item.qrCode}
                      alt="QR Code"
                      className="w-12 h-12 border rounded"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadQRCode(item)}
                      className="text-xs p-1 h-6"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateQRCode(item.id)}
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">{item.equipmentType}</Badge>
                {item.location && (
                  <p className="text-sm text-muted-foreground">{item.location}</p>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Wrench className="w-4 h-4" />
                  <span>{item.carbonBrushCount || 0} Brush Records</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>{item.windingResistanceCount || 0} Winding Records</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/equipment/${item.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Link href={`/carbon-brush?equipment=${item.tagNo}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Add Brush
                  </Button>
                </Link>
                <Link href={`/winding-resistance?equipment=${item.tagNo}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Add Winding
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No equipment found.</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            Add First Equipment
          </Button>
        </div>
      )}

      <EquipmentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
