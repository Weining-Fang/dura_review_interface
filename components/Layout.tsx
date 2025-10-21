/**
 * Main Layout Component - Three Panel System
 * Left: Map + Context Pane
 * Center: Gallery or IIIF Viewer
 * Right: Facets + Metadata
 */

import React, { ReactNode } from 'react';

interface LayoutProps {
  children?: ReactNode;
  leftPanel?: ReactNode;
  centerPanel?: ReactNode;
  rightPanel?: ReactNode;
}

export default function Layout({ leftPanel, centerPanel, rightPanel }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Left Panel - Map View */}
      <div className="w-2/5 flex flex-col border-r border-gray-200 bg-white relative">
        {leftPanel}
      </div>

      {/* Center Panel - Gallery or Detail View */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {centerPanel}
      </div>

      {/* Right Panel - Facets and Metadata */}
      <div className="w-1/4 flex flex-col border-l border-gray-200 bg-white overflow-y-auto">
        {rightPanel}
      </div>
    </div>
  );
}

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function LeftPanel({ children, className = '' }: PanelProps) {
  return (
    <div className={`w-2/5 flex flex-col border-r border-gray-200 bg-white relative ${className}`}>
      {children}
    </div>
  );
}

export function CenterPanel({ children, className = '' }: PanelProps) {
  return (
    <div className={`flex-1 flex flex-col bg-gray-50 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function RightPanel({ children, className = '' }: PanelProps) {
  return (
    <div className={`w-1/4 flex flex-col border-l border-gray-200 bg-white overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}

