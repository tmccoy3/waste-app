'use client';

import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableCardProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function DraggableCard({ id, title, children, className = '' }: DraggableCardProps) {
  const [isLayoutMode, setIsLayoutMode] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isLayoutMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Listen for layout mode changes from parent
  useEffect(() => {
    const handleLayoutModeChange = (event: CustomEvent) => {
      setIsLayoutMode(event.detail.isLayoutMode);
    };

    window.addEventListener('layoutModeChange', handleLayoutModeChange as EventListener);
    return () => {
      window.removeEventListener('layoutModeChange', handleLayoutModeChange as EventListener);
    };
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`draggable-card ${className} ${isDragging ? 'dragging' : ''} ${isLayoutMode ? 'layout-mode' : ''}`}
      {...attributes}
    >
      {/* Drag Handle - Only visible in layout mode */}
      {isLayoutMode && (
        <div className="drag-handle" {...listeners}>
          <div className="drag-handle-content">
            <div className="drag-handle-dots">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="drag-handle-title">{title}</span>
          </div>
        </div>
      )}
      
      {/* Card Content */}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
} 