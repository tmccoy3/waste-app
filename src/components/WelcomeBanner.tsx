'use client'

import React, { useState, useEffect } from 'react'
import { Search, Bot, Clock, User, Sparkles, Sun, Moon, Sunset } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface WelcomeBannerProps {
  userName?: string
}

interface SearchResult {
  answer: string
  confidence: number
  sources: string[]
  timestamp: string
}

export default function WelcomeBanner({ userName = 'Team Member' }: WelcomeBannerProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Update time every second - set initial time on client only
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Determine time of day and background
  const getTimeOfDay = () => {
    if (!currentTime) return 'morning' // Default to morning during hydration
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 20) return 'evening'
    return 'night'
  }

  const getGreeting = () => {
    const timeOfDay = getTimeOfDay()
    switch (timeOfDay) {
      case 'morning': return 'Good Morning'
      case 'afternoon': return 'Good Afternoon'
      case 'evening': return 'Good Evening'
      case 'night': return 'Good Evening'
      default: return 'Welcome'
    }
  }

  const getBackgroundClasses = () => {
    const timeOfDay = getTimeOfDay()
    switch (timeOfDay) {
      case 'morning':
        return 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600'
      case 'afternoon':
        return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500'
      case 'evening':
        return 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500'
      case 'night':
        return 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'
      default:
        return 'bg-gradient-to-br from-blue-500 to-purple-600'
    }
  }

  const getTimeIcon = () => {
    const timeOfDay = getTimeOfDay()
    switch (timeOfDay) {
      case 'morning':
        return <Sun className="h-6 w-6 text-yellow-300" />
      case 'afternoon':
        return <Sun className="h-6 w-6 text-yellow-400" />
      case 'evening':
        return <Sunset className="h-6 w-6 text-orange-300" />
      case 'night':
        return <Moon className="h-6 w-6 text-blue-300" />
      default:
        return <Clock className="h-6 w-6 text-white" />
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowSearchResults(true)

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const result = await response.json()
      setSearchResult(result)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResult({
        answer: 'Sorry, I encountered an error while searching. Please try again.',
        confidence: 0,
        sources: [],
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query)
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent
    handleSearch(fakeEvent)
  }

  const quickSearchOptions = [
    'Show me our revenue this month',
    'How many customers do we have?',
    'What are our top performing routes?',
    'Fleet utilization summary',
    'Customer satisfaction metrics'
  ]

  return (
    <div className={`relative overflow-hidden rounded-xl ${getBackgroundClasses()} text-white mb-6`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(255,255,255,0.1)_21%,_rgba(255,255,255,0.1)_25%,_transparent_26%)]"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          {/* Welcome Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getTimeIcon()}
              <div>
                <h1 className="text-2xl font-bold">{getGreeting()}, {userName}!</h1>
                <p className="text-white/80 text-sm">
                  {currentTime ? formatDate(currentTime) : 'Loading...'}
                </p>
              </div>
            </div>
          </div>

          {/* Time Display */}
          <div className="text-right">
            <div className="text-3xl font-mono font-bold tracking-wider">
              {currentTime ? formatTime(currentTime) : '--:--:--'}
            </div>
            <div className="text-white/80 text-sm flex items-center justify-end space-x-1">
              <Clock className="h-4 w-4" />
              <span>Real-time</span>
            </div>
          </div>
        </div>

        {/* AI Search Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <h2 className="text-lg font-semibold">Ask WasteOps AI</h2>
            <Bot className="h-5 w-5 text-blue-300" />
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Ask about customers, revenue, fleet, routes, or anything else..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm"
            >
              {isSearching ? (
                <Bot className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Quick Search Options */}
          <div className="flex flex-wrap gap-2">
            {quickSearchOptions.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch(option)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 text-xs backdrop-blur-sm"
              >
                {option}
              </Button>
            ))}
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mt-4">
              {isSearching ? (
                <div className="flex items-center space-x-2 text-white/80">
                  <Bot className="h-4 w-4 animate-spin" />
                  <span>Searching through customer data, financial records, and operational metrics...</span>
                </div>
              ) : searchResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-blue-300" />
                      <span className="text-sm font-medium">WasteOps AI</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-white/70">
                      <div className={`w-2 h-2 rounded-full ${
                        searchResult.confidence > 80 ? 'bg-green-400' : 
                        searchResult.confidence > 60 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <span>{searchResult.confidence}% confidence</span>
                    </div>
                  </div>
                  
                  <div className="text-white">
                    {searchResult.answer}
                  </div>
                  
                  {searchResult.sources.length > 0 && (
                    <div className="text-xs text-white/70">
                      <span className="font-medium">Sources:</span> {searchResult.sources.join(', ')}
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSearchResults(false)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 text-xs"
                  >
                    Close
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 