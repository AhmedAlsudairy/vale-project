"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { QRScanner } from "@/components/qr-scanner"

interface EquipmentData {
  tag_no: string
  equipment_name: string
  equipment_type: string
  location: string
  installation_date: string
}

interface EquipmentFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: EquipmentData) => void
  initialData?: Partial<EquipmentData>
}

export function EquipmentForm({ open, onClose, onSubmit, initialData }: EquipmentFormProps) {
  const [formData, setFormData] = useState<EquipmentData>({
    tag_no: initialData?.tag_no || "",
    equipment_name: initialData?.equipment_name || "",
    equipment_type: initialData?.equipment_type || "Motor",
    location: initialData?.location || "",
    installation_date: initialData?.installation_date || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleQRScan = (data: string) => {
    // Try to parse equipment data from QR code
    try {
      const parsed = JSON.parse(data)
      if (parsed.tagNo) {
        setFormData((prev: EquipmentData) => ({
          ...prev,
          tag_no: parsed.tagNo,
          equipment_name: parsed.equipmentName || "",
          equipment_type: parsed.equipmentType || "Motor",
          location: parsed.location || "",
        }))
      }
    } catch {
      // If not JSON, treat as tag number
      setFormData((prev: EquipmentData) => ({
        ...prev,
        tag_no: data,
      }))
    }
  }

  const equipmentTypes = [
    "Motor",
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Equipment" : "Add New Equipment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag_no">Motor No / Tag No *</Label>
            <div className="flex gap-2">
              <Input
                id="tag_no"
                placeholder="e.g., BO.3161.04.M1"
                value={formData.tag_no}
                onChange={(e) =>
                  setFormData((prev: EquipmentData) => ({ ...prev, tag_no: e.target.value }))
                }
                required
                className="flex-1"
              />
              <QRScanner onScan={handleQRScan} />
            </div>
            <p className="text-xs text-muted-foreground">
              Select or add Motor No (e.g., BO.3161.04.M1)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment_name">Equipment Name *</Label>
            <Input
              id="equipment_name"
              placeholder="e.g., Induration Fan Motor"
              value={formData.equipment_name}
              onChange={(e) =>
                setFormData((prev: EquipmentData) => ({ ...prev, equipment_name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment_type">Equipment Type *</Label>
            <Select
              value={formData.equipment_type}
              onValueChange={(value) =>
                setFormData((prev: EquipmentData) => ({ ...prev, equipment_type: value }))
              }
            >
              <SelectTrigger>
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
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Induration Area"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev: EquipmentData) => ({ ...prev, location: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="installation_date">Installation Date</Label>
            <Input
              id="installation_date"
              type="date"
              value={formData.installation_date}
              onChange={(e) =>
                setFormData((prev: EquipmentData) => ({ ...prev, installation_date: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {initialData ? "Update" : "Create"} Equipment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
