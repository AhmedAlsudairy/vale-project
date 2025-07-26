"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { Home, BarChart3, Clipboard, Settings, Menu, X, Zap, Package } from "lucide-react"
import { useState } from "react"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="font-bold text-base sm:text-lg">MV Motors</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/equipment">
              <Button variant="ghost" size="sm" className="text-sm">
                <Package className="h-4 w-4 mr-2" />
                Equipment
              </Button>
            </Link>
            <Link href="/carbon-brush">
              <Button variant="ghost" size="sm" className="text-sm">
                <Clipboard className="h-4 w-4 mr-2" />
                Brushes Tests
              </Button>
            </Link>
            <Link href="/winding-resistance">
              <Button variant="ghost" size="sm" className="text-sm">
                <Zap className="h-4 w-4 mr-2" />
                Winding Tests
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t">
            <div className="flex flex-col space-y-2 pt-4">
              <Link href="/" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/equipment" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <Package className="h-4 w-4 mr-2" />
                  Equipment
                </Button>
              </Link>
              <Link href="/carbon-brush" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <Clipboard className="h-4 w-4 mr-2" />
                  Brushes Tests
                </Button>
              </Link>
              <Link href="/winding-resistance" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Winding Tests
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="min-h-screen bg-background">
              <Navigation />
              <main className="min-h-[calc(100vh-4rem)]">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
