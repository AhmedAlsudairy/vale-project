'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Download, Thermometer, Calendar, User, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface ThermographyRecord {
  id: number
  transformerNo: string
  equipmentType: string
  inspectionDate: string
  month: number
  doneBy?: string
  measurements: {
    mccbRPhase: number
    mccbBPhase: number
    mccbCOG1: number
    mccbCOG2: number
    mccbBodyTemp: number
    kvMa: number
    spMin: number
    scrCoolingFinsTemp: number
    scrCoolingFan: number
    panelExhaustFan: number
    mccForcedCoolingFanTemp: number
    rdi68: number
    rdi69: number
    rdi70: number
  }
  remarks?: string
  createdAt: string
  equipment?: {
    equipmentName: string
    equipmentType: string
  }
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function ThermographyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<ThermographyRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchRecord()
    }
  }, [params.id])

  const fetchRecord = async () => {
    try {
      const response = await fetch(`/api/thermography/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRecord(data)
      } else {
        console.error('Record not found')
      }
    } catch (error) {
      console.error('Error fetching record:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportSingle = () => {
    if (record) {
      const { exportSingleThermographyToExcel } = require('@/lib/excel-utils')
      exportSingleThermographyToExcel(record)
    }
  }

  const getTemperatureStatus = (temp: number): { status: string; color: string } => {
    if (temp > 80) return { status: 'Critical', color: 'destructive' }
    if (temp > 60) return { status: 'Warning', color: 'destructive' }
    if (temp > 40) return { status: 'Caution', color: 'secondary' }
    return { status: 'Normal', color: 'default' }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Thermometer className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p>Loading thermography record...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <Thermometer className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Record not found</h2>
          <p className="text-muted-foreground mb-4">
            The thermography record you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push('/thermography')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Thermography
          </Button>
        </div>
      </div>
    )
  }

  const temperatureData = [
    { label: 'MCCB R-Phase', value: record.measurements.mccbRPhase, unit: '°C' },
    { label: 'MCCB B-Phase', value: record.measurements.mccbBPhase, unit: '°C' },
    { label: 'MCCB C O/G-1', value: record.measurements.mccbCOG1, unit: '°C' },
    { label: 'MCCB C O/G-2', value: record.measurements.mccbCOG2, unit: '°C' },
    { label: 'MCCB Body Temp', value: record.measurements.mccbBodyTemp, unit: '°C' },
    { label: 'SCR Cooling Fins', value: record.measurements.scrCoolingFinsTemp, unit: '°C' },
    { label: 'SCR Cooling Fan', value: record.measurements.scrCoolingFan, unit: '°C' },
    { label: 'Panel Exhaust Fan', value: record.measurements.panelExhaustFan, unit: '°C' },
    { label: 'MCC Forced Cooling Fan', value: record.measurements.mccForcedCoolingFanTemp, unit: '°C' }
  ]

  const otherMeasurements = [
    { label: 'kV/mA', value: record.measurements.kvMa, unit: '' },
    { label: 'SP/Min', value: record.measurements.spMin, unit: 'rpm' },
    { label: 'RDI68', value: record.measurements.rdi68, unit: '' },
    { label: 'RDI69', value: record.measurements.rdi69, unit: '' },
    { label: 'RDI70', value: record.measurements.rdi70, unit: '' }
  ]

  const maxTemp = Math.max(...temperatureData.map(t => t.value))
  const overallStatus = getTemperatureStatus(maxTemp)

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/thermography')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Thermometer className="h-8 w-8 text-orange-500" />
              {record.transformerNo} Thermography
            </h1>
            <p className="text-muted-foreground mt-1">
              Detailed temperature measurement report
            </p>
          </div>
        </div>
        <Button onClick={handleExportSingle} size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Temperature Measurements
            </CardTitle>
            <CardDescription>
              All temperature readings for {record.transformerNo}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {temperatureData.map((measurement, index) => {
                const tempStatus = getTemperatureStatus(measurement.value)
                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {measurement.label}
                      </p>
                      <Badge variant={tempStatus.color as any} className="text-xs">
                        {tempStatus.status}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">
                      {measurement.value}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {measurement.unit}
                      </span>
                    </p>
                  </div>
                )
              })}
            </div>

            <Separator className="my-6" />

            <h4 className="text-lg font-semibold mb-4">Other Measurements</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherMeasurements.map((measurement, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {measurement.label}
                  </p>
                  <p className="text-2xl font-bold">
                    {measurement.value}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {measurement.unit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Side Information */}
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Badge variant={overallStatus.color as any} className="text-lg px-4 py-2 mb-4">
                  {overallStatus.status}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Maximum Temperature: {maxTemp}°C
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Record Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Record Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Inspection Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(record.inspectionDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Month</p>
                  <p className="text-sm text-muted-foreground">
                    {months[record.month - 1]}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Inspector</p>
                  <p className="text-sm text-muted-foreground">
                    {record.doneBy || 'Not specified'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Equipment Type</p>
                  <p className="text-sm text-muted-foreground">
                    {record.equipmentType}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remarks */}
          {record.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{record.remarks}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
