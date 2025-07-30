'use client'

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Clipboard, QrCode, Settings, TrendingUp, Wrench, Shield, Clock, Package, Thermometer } from "lucide-react"

interface Stats {
  systemUptime: string
  efficiencyImprovement: string
  costReduction: string
  downtimeReduction: string
  totalEquipment: number
  totalInspections: number
  recentInspections: number
  criticalEquipment: number
  lastUpdated: string
  fallback?: boolean
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    systemUptime: "99.5%",
    efficiencyImprovement: "75%",
    costReduction: "45%",
    downtimeReduction: "25%",
    totalEquipment: 0,
    totalInspections: 0,
    recentInspections: 0,
    criticalEquipment: 0,
    lastUpdated: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Hero Section - Responsive */}
      <div className="text-center mb-8 sm:mb-12 lg:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">MV Motors Maintenance System</h1>
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl lg:max-w-4xl mx-auto px-4">
          Comprehensive maintenance management for carbon brushes and electrical equipment with predictive analytics and
          QR code integration.
        </p>
      </div>

      {/* Main Feature Cards - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Equipment Management
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Manage motor equipment with QR codes for easy access and tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/equipment">
              <Button className="w-full text-sm sm:text-base">Manage Equipment</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clipboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Carbon Brush Records
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Record and track carbon brush measurements, slip ring data, and maintenance history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/carbon-brush">
              <Button className="w-full text-sm sm:text-base">Start </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Winding Resistance
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Monitor winding resistance, IR values, and polarization index measurements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/winding-resistance">
              <Button className="w-full text-sm sm:text-base">Start Testing</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Thermometer className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              ESP MCC Thermography
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Monitor thermal conditions and temperature readings for ESP transformers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/thermography">
              <Button className="w-full text-sm sm:text-base">Monitor ESP</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Thermometer className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              LRS Thermography
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Monitor thermal conditions for Liquid Resistor Starter equipment and contactors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/thermography?tab=lrs">
              <Button className="w-full text-sm sm:text-base">Monitor LRS</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Dashboard & Analytics
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              View equipment health, trends, and predictive maintenance insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full text-sm sm:text-base">View Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Feature Details & Stats - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Key Features */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start gap-3">
                <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm sm:text-base font-medium">QR Code Integration</span>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Generate and scan QR codes for quick data entry and equipment identification
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm sm:text-base font-medium">Predictive Maintenance</span>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    AI-powered forecasting based on historical wear patterns and usage data
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm sm:text-base font-medium">Real-time Analytics</span>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Live equipment health monitoring with interactive charts and alerts
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clipboard className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm sm:text-base font-medium">Historical Tracking</span>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Complete maintenance history with reference measurements and trends
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm sm:text-base font-medium">Thermal Monitoring</span>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    ESP MCC thermography with temperature alerts and thermal condition tracking
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm sm:text-base font-medium">Smart Alerts</span>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Automated notifications for critical equipment conditions and maintenance schedules
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">System Performance</CardTitle>
            <CardDescription className="text-sm sm:text-base">Key metrics and system capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-1" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {loading ? "..." : stats.systemUptime}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">System Availability</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-1" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {loading ? "..." : stats.efficiencyImprovement}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Process Efficiency</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-1" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {loading ? "..." : stats.costReduction}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Cost Reduction</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-1" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {loading ? "..." : stats.downtimeReduction}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Downtime Reduction</p>
              </div>
            </div>

            {/* Additional Info with Real Data */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="font-semibold text-sm sm:text-base mb-2 text-primary">Real-Time Statistics</h4>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <li>• {loading ? "Loading..." : `${stats.totalEquipment} Equipment Units Managed`}</li>
                <li>• {loading ? "Loading..." : `${stats.totalInspections} Total Inspections Completed`}</li>
                <li>• {loading ? "Loading..." : `${stats.recentInspections} Inspections Last 30 Days`}</li>
                <li>• {loading ? "Loading..." : `${stats.criticalEquipment} Equipment Needs Attention`}</li>
                {stats.fallback && <li>• <span className="text-orange-600">Using fallback data (database offline)</span></li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action - Responsive */}
      <div className="mt-8 sm:mt-12 lg:mt-16 text-center">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 sm:pt-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">
              Ready to Transform Your Maintenance?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto">
              Start with a carbon brush  or explore the dashboard to see how predictive maintenance can
              optimize your operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
              <Link href="/carbon-brush" className="flex-1">
                <Button className="w-full text-sm sm:text-base">Start Testing</Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full text-sm sm:text-base bg-transparent">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
