'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'

interface DraggableDashboardProps {
  children: React.ReactNode
  currentView: string
}

export default function DraggableDashboard({ children, currentView }: DraggableDashboardProps) {
  const [isLayoutMode, setIsLayoutMode] = useState(false)
  const [items, setItems] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle hydration
  useEffect(() => {
    setIsClient(true)
    
    // Initialize items array with default order
    const defaultItems = [
      'business-snapshot',
      'recent-payments', 
      'system-sync',
      'performance-overview',
      'route-activity',
      'revenue-chart',
      'zone-map',
      'customer-dashboard'
    ]

    // Load saved layout from localStorage
    const savedLayout = localStorage.getItem(`dashboard-layout-${currentView}`)
    if (savedLayout) {
      try {
        setItems(JSON.parse(savedLayout))
      } catch (error) {
        console.error('Failed to parse saved layout:', error)
        setItems(defaultItems)
      }
    } else {
      setItems(defaultItems)
    }
  }, [currentView])

  // Save layout to localStorage whenever items change
  useEffect(() => {
    if (isClient && items.length > 0) {
      localStorage.setItem(`dashboard-layout-${currentView}`, JSON.stringify(items))
    }
  }, [items, currentView, isClient])

  // Dispatch layout mode changes to child components
  useEffect(() => {
    if (isClient) {
      window.dispatchEvent(new CustomEvent('layoutModeChange', {
        detail: { isLayoutMode }
      }))
    }
  }, [isLayoutMode, isClient])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const resetLayout = () => {
    const defaultItems = [
      'business-snapshot',
      'recent-payments', 
      'system-sync',
      'performance-overview',
      'route-activity',
      'revenue-chart',
      'zone-map',
      'customer-dashboard'
    ]
    setItems(defaultItems)
    if (isClient) {
      localStorage.removeItem(`dashboard-layout-${currentView}`)
    }
  }

  // Don't render drag functionality during SSR
  if (!isClient) {
    return <div className="dashboard-container">{children}</div>
  }

  return (
    <div className="dashboard-container">
      {/* Layout Controls */}
      <div className="layout-controls">
        <button
          onClick={() => setIsLayoutMode(!isLayoutMode)}
          className={`layout-toggle ${isLayoutMode ? 'active' : ''}`}
        >
          {isLayoutMode ? 'Exit Layout' : 'Edit Layout'}
        </button>
        {isLayoutMode && (
          <button
            onClick={resetLayout}
            className="reset-layout"
          >
            Reset Layout
          </button>
        )}
      </div>

      {/* Layout Mode Notification */}
      {isLayoutMode && (
        <div className="layout-mode-notification">
          <span>🎯 Layout Mode Active - Drag cards to rearrange</span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          {children}
        </SortableContext>
      </DndContext>
    </div>
  )
} 