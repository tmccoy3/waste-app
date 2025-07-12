'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'ceo-insights', label: 'CEO Insights', href: '/dashboard/ceo-insights' },
  { id: 'rfp-intelligence', label: 'RFP Intelligence', href: '/dashboard/rfp-intelligence' },
  { id: 'serviceability', label: 'Serviceability Check', href: '/dashboard/serviceability-check' },
]

export default function DashboardLayout({
  children,
}: {
  children: any
}) {
  const pathname = usePathname()
  const router = useRouter()

  const getActiveItem = () => {
    if (pathname === '/dashboard') return 'dashboard'
    if (pathname === '/dashboard/ceo-insights') return 'ceo-insights'
    if (pathname === '/dashboard/rfp-intelligence') return 'rfp-intelligence'
    if (pathname === '/dashboard/serviceability-check') return 'serviceability'
    return 'dashboard'
  }

  const handleNavigation = (itemId: string) => {
    const item = navigationItems.find(nav => nav.id === itemId)
    if (item && item.href) {
      router.push(item.href)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 mb-6">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-2xl font-semibold text-blue-600">WasteOps Intelligence</h1>
        </div>
        
        {/* Navigation Tabs */}
        <div className="px-6">
          <Tabs value={getActiveItem()} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0 border-b border-slate-200">
              {navigationItems.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 pb-6">
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
} 