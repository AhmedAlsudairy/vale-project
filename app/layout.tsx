import type React from "react"
import type { Metadata } from "next"
import ClientRootLayout from "./client_layout"

export const metadata: Metadata = {
  title: "MV Motors Maintenance System",
  description: "Comprehensive maintenance management for carbon brushes and electrical equipment",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientRootLayout>{children}</ClientRootLayout>
}


import './globals.css'