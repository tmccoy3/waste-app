'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import DraggableCard with no SSR
const DraggableCard = dynamic(
  () => import('./DraggableCard'),
  { 
    ssr: false,
    loading: ({ id, title, children, className }: any) => (
      <div className={className}>
        {children}
      </div>
    )
  }
);

interface ClientOnlyDraggableCardProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function ClientOnlyDraggableCard({ 
  id, 
  title, 
  children, 
  className = '' 
}: ClientOnlyDraggableCardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Render static content during SSR and initial client render
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  // Only render drag-and-drop after component has mounted on client
  return (
    <DraggableCard id={id} title={title} className={className}>
      {children}
    </DraggableCard>
  );
} 