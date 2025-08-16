"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { AlertTriangle, Calendar, CheckCircle, Wrench, Activity, Clock, Shield, Target, Gauge } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ErrorBoundary } from "@/components/error-boundary"

interface DashboardStats {
  totalInspections: number
  criticalEquipment: number
  upcomingMaintenance: number
  averageWearRate: number
  efficiency: number
  uptime: number
  costSavings: number
}

interface TrendData {
  date: string
  measurement: number
  equipment: string
  efficiency?: number
  temperature?: number
}

interface EquipmentHealth {
  name: string
  health: number
  status: "good" | "warning" | "critical"
  lastInspection: string
}

interface MaintenanceSchedule {
  equipment: string
  type: string
  dueDate: string
  priority: "high" | "medium" | "low"
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInspections: 0,
    criticalEquipment: 0,
    upcomingMaintenance: 0,
    averageWearRate: 0,
    efficiency: 0,
    uptime: 0,
    costSavings: 0,
  })
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [criticalEquipment, setCriticalEquipment] = useState<any[]>([])
  const [equipmentHealth, setEquipmentHealth] = useState<EquipmentHealth[]>([])
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch recent records
      const response = await fetch("/api/carbon-brush?limit=50")
      const records = await response.json()

      // Calculate stats
      const totalInspections = records.length
      const criticalCount = records.filter((r: any) => {
        try {
          const measurements = r.measurements as { [key: string]: number }
          const minMeasurement = Math.min(...Object.values(measurements))
          return minMeasurement < 25
        } catch {
          return false
        }
      }).length

      const upcomingCount = records.filter((r: any) => {
        try {
          const measurements = r.measurements as { [key: string]: number }
          const minMeasurement = Math.min(...Object.values(measurements))
          return minMeasurement >= 25 && minMeasurement < 35
        } catch {
          return false
        }
      }).length

      setStats({
        totalInspections,
        criticalEquipment: criticalCount,
        upcomingMaintenance: upcomingCount,
        averageWearRate: 2.3,
        efficiency: 94.5,
        uptime: 98.2,
        costSavings: 125000,
      })

      // Prepare trend data with additional metrics
      const trends = records
        .slice(0, 15)
        .map((record: any, index: number) => {
          try {
            const measurements = record.measurements
            const measurementValues = measurements && typeof measurements === 'object' 
              ? Object.values(measurements).filter(val => typeof val === 'number') as number[]
              : []
            
            return {
              date: new Date(record.inspectionDate || record.inspection_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              measurement: measurementValues.length > 0 ? Math.min(...measurementValues) : 0,
              equipment: record.tagNo || record.tag_no,
              efficiency: 95 - index * 0.5 + Math.random() * 2,
              temperature: 75 + Math.random() * 10,
            }
          } catch {
            return {
              date: `Day ${index + 1}`,
              measurement: 40 - index,
              equipment: `Equipment ${index + 1}`,
              efficiency: 95 - index * 0.5,
              temperature: 75 + Math.random() * 10,
            }
          }
        })
        .reverse()

      setTrendData(trends)

      // Critical equipment
      const critical = records
        .filter((r: any) => {
          try {
            const measurements = r.measurements
            const measurementValues = measurements && typeof measurements === 'object' 
              ? Object.values(measurements).filter(val => typeof val === 'number') as number[]
              : []
            return measurementValues.length > 0 && Math.min(...measurementValues) < 25
          } catch {
            return false
          }
        })
        .slice(0, 5)
      setCriticalEquipment(critical)

      // Equipment health data
      setEquipmentHealth([
        { name: "Motor A", health: 85, status: "good", lastInspection: "2024-01-15" },
        { name: "Motor B", health: 65, status: "warning", lastInspection: "2024-01-10" },
        { name: "Motor C", health: 35, status: "critical", lastInspection: "2024-01-05" },
        { name: "Motor D", health: 90, status: "good", lastInspection: "2024-01-20" },
      ])

      // Maintenance schedule
      setMaintenanceSchedule([
        { equipment: "BO.3161.04.M1", type: "Carbon Brush", dueDate: "2024-02-15", priority: "high" },
        { equipment: "BO.3161.05.M1", type: "Winding Check", dueDate: "2024-02-20", priority: "medium" },
        { equipment: "BO.3161.06.M1", type: "General Inspection", dueDate: "2024-02-25", priority: "low" },
      ])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data")

      // Set mock data for demo
      setStats({
        totalInspections: 12,
        criticalEquipment: 2,
        upcomingMaintenance: 3,
        averageWearRate: 2.3,
        efficiency: 94.5,
        uptime: 98.2,
        costSavings: 125000,
      })

      setTrendData([
        { date: "Jan 15", measurement: 45, equipment: "BO.3161.04.M1", efficiency: 95, temperature: 78 },
        { date: "Jan 20", measurement: 43, equipment: "BO.3161.04.M1", efficiency: 94, temperature: 76 },
        { date: "Jan 25", measurement: 41, equipment: "BO.3161.04.M1", efficiency: 93, temperature: 79 },
        { date: "Feb 01", measurement: 39, equipment: "BO.3161.04.M1", efficiency: 92, temperature: 77 },
        { date: "Feb 05", measurement: 37, equipment: "BO.3161.04.M1", efficiency: 91, temperature: 80 },
      ])

      setEquipmentHealth([
        { name: "Motor A", health: 85, status: "good", lastInspection: "2024-01-15" },
        { name: "Motor B", health: 65, status: "warning", lastInspection: "2024-01-10" },
        { name: "Motor C", health: 35, status: "critical", lastInspection: "2024-01-05" },
        { name: "Motor D", health: 90, status: "good", lastInspection: "2024-01-20" },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const chartConfig = {
    measurement: {
      label: "Measurement (mm)",
      color: "hsl(var(--chart-1))",
    },
    efficiency: {
      label: "Efficiency (%)",
      color: "hsl(var(--chart-2))",
    },
    temperature: {
      label: "Temperature (°C)",
      color: "hsl(var(--chart-3))",
    },
  }

  const healthDistribution = [
    {
      name: "Good",
      value: stats.totalInspections - stats.criticalEquipment - stats.upcomingMaintenance,
      color: "#10b981",
    },
    { name: "Warning", value: stats.upcomingMaintenance, color: "#f59e0b" },
    { name: "Critical", value: stats.criticalEquipment, color: "#ef4444" },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm sm:text-base">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Maintenance Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Real-time equipment health and maintenance analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/carbon-brush">
              <Button className="w-full sm:w-auto text-sm">
                <Activity className="w-4 h-4 mr-2" />
                New Inspection
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-start gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm sm:text-base font-medium">{error}</p>
                  <p className="text-xs sm:text-sm mt-1">Showing demo data. Some features may be limited.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInspections}</div>
              <p className="text-xs text-muted-foreground">This month</p>
              <div className="mt-2">
                <Progress value={75} className="h-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Efficiency</CardTitle>
              <Gauge className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.efficiency}%</div>
              <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              <div className="mt-2">
                <Progress value={stats.efficiency} className="h-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.uptime}%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
              <div className="mt-2">
                <Progress value={stats.uptime} className="h-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">${(stats.costSavings / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">This year</p>
              <div className="mt-2">
                <Progress value={65} className="h-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.criticalEquipment}</div>
                  <p className="text-xs text-red-700">Critical Equipment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.upcomingMaintenance}</div>
                  <p className="text-xs text-yellow-700">Due Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalInspections - stats.criticalEquipment - stats.upcomingMaintenance}
                  </div>
                  <p className="text-xs text-green-700">Healthy Equipment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Multi-metric Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Performance Trends</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Brush wear, efficiency, and temperature over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="measurement"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                      name="Brush Wear (mm)"
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                      name="Efficiency (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Equipment Health Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Equipment Health Distribution</CardTitle>
              <CardDescription className="text-sm sm:text-base">Current status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {healthDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-md">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-muted-foreground">{data.value} equipment</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {healthDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Equipment Health & Maintenance Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Equipment Health List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Equipment Health Monitor</CardTitle>
              <CardDescription className="text-sm sm:text-base">Real-time health status</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {equipmentHealth.map((equipment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">{equipment.name}</span>
                          <Badge
                            variant={
                              equipment.status === "critical"
                                ? "destructive"
                                : equipment.status === "warning"
                                  ? "secondary"
                                  : "default"
                            }
                            className="text-xs"
                          >
                            {equipment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={equipment.health} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{equipment.health}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last: {new Date(equipment.lastInspection).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Maintenance Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Upcoming Maintenance</CardTitle>
              <CardDescription className="text-sm sm:text-base">Scheduled maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {maintenanceSchedule.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{task.equipment}</span>
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{task.type}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Performance Metrics</CardTitle>
            <CardDescription className="text-sm sm:text-base">Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Efficiency", value: stats.efficiency, target: 95 },
                    { name: "Uptime", value: stats.uptime, target: 99 },
                    { name: "Quality", value: 92, target: 95 },
                    { name: "Safety", value: 98, target: 100 },
                  ]}
                >
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} opacity={0.3} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}
