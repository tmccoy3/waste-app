'use client'

import React from 'react'
import WelcomeBanner from '@/components/WelcomeBanner'

export default function DashboardLayout({
  children,
}: {
  children: any
}) {

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <main className="px-6 pt-6 pb-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <WelcomeBanner userName="Team Member" />
          
          {children}
        </div>
      </main>
    </div>
  )
} 