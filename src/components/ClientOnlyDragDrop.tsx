'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import DraggableDashboard with no SSR
const DraggableDashboard = dynamic(
  () => import('./DraggableDashboard'),
  { 
    ssr: false,
    loading: () => <div className="dashboard-container">Loading...</div>
  }
);

interface ClientOnlyDragDropProps {
  children: React.ReactNode;
  currentView: string;
}

export default function ClientOnlyDragDrop({ children, currentView }: ClientOnlyDragDropProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Render static content during SSR and initial client render
    return <div className="dashboard-container">{children}</div>;
  }

  // Only render drag-and-drop after component has mounted on client
  return (
    <DraggableDashboard currentView={currentView}>
      {children}
    </DraggableDashboard>
  );
} 