"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  TrendingUp, 
  BarChart3, 
  Settings,
  FileText,
  MapPin
} from "lucide-react"
import { useEffect, useState } from "react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Operations overview and customer metrics"
  },
  {
    name: "CEO Insights",
    href: "/dashboard/ceo-insights",
    icon: TrendingUp,
    description: "Executive analytics and business valuation"
  },
  {
    name: "RFP Intelligence",
    href: "/dashboard/rfp-intelligence",
    icon: FileText,
    description: "RFP analysis and competitive intelligence"
  },
  {
    name: "Serviceability Check",
    href: "/dashboard/serviceability-check",
    icon: MapPin,
    description: "Address validation and service area analysis"
  },
]

export default function Sidebar() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="fixed left-0 top-0 h-screen w-64 bg-[#ffffff] border-r border-gray-200 overflow-y-auto z-50 shadow-sm">
        <div className="animate-pulse p-4">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#ffffff] border-r border-gray-200 overflow-y-auto z-50 shadow-sm">
      <div className="flex h-full flex-col">
        {/* Logo/Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">WasteOps</span>
              <span className="text-sm text-gray-500">Intelligence</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
                title={item.description}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <Settings className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">Settings</span>
              <span className="text-xs text-gray-500">System configuration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 