import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Clipboard, QrCode, Settings, TrendingUp, Wrench, Shield, Clock } from "lucide-react"

export default function HomePage() {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clipboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Carbon Brush Inspection
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Record and track carbon brush measurements, slip ring data, and maintenance history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/carbon-brush">
              <Button className="w-full text-sm sm:text-base">Start Inspection</Button>
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

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 md:col-span-2 lg:col-span-1">
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
                <div className="text-xl sm:text-2xl font-bold text-primary">24/7</div>
                <p className="text-xs sm:text-sm text-muted-foreground">System Availability</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-1" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary">95%</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Prediction Accuracy</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-1" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary">50%</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Cost Reduction</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-1" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary">30%</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Downtime Reduction</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="font-semibold text-sm sm:text-base mb-2 text-primary">Enterprise Ready</h4>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <li>• Cloud-based with offline capability</li>
                <li>• Multi-user access with role management</li>
                <li>• API integration with existing systems</li>
                <li>• Automated backup and data security</li>
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
              Start with a carbon brush inspection or explore the dashboard to see how predictive maintenance can
              optimize your operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
              <Link href="/carbon-brush" className="flex-1">
                <Button className="w-full text-sm sm:text-base">Start Inspection</Button>
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
