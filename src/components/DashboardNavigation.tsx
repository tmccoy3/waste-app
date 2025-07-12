'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, BarChart3, Target, MapPin } from 'lucide-react'

interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
  description: string
}

const navItems: NavItem[] = [
  {
    name: 'Main Dashboard',
    path: '/dashboard',
    icon: <Home className="w-4 h-4" />,
    description: 'Operations overview and customer metrics'
  },
  {
    name: 'CEO Insights',
    path: '/dashboard/ceo-insights',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Executive analytics and business valuation'
  },
  {
    name: 'RFP Intelligence',
    path: '/dashboard/rfp-intelligence',
    icon: <Target className="w-4 h-4" />,
    description: 'RFP analysis and competitive intelligence'
  },
  {
    name: 'Serviceability Check',
    path: '/dashboard/serviceability-check',
    icon: <MapPin className="w-4 h-4" />,
    description: 'Address validation and service area analysis'
  }
]

export function DashboardNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 mb-6">
      <div className="px-6 py-4">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={item.description}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 