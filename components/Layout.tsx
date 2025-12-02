/**
 * Main Layout Component - Three-View Architecture
 * Full-bleed primary view with utility rail sidebar
 */

import React, { ReactNode } from 'react';
import ViewSwitcher from './ViewSwitcher';

interface LayoutProps {
  children: ReactNode;
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  showViewSwitcher?: boolean;
}

export default function Layout({
  children,
  leftSidebar,
  rightSidebar,
  showViewSwitcher = true
}: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Optional Left Sidebar */}
      {leftSidebar && (
        <div className="w-80 flex flex-col border-r border-gray-200 bg-white min-h-0">
          {leftSidebar}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Bar with View Switcher */}
        {showViewSwitcher && (
          <div className="flex items-center justify-center px-4 py-3 border-b border-gray-200 bg-white">
            <ViewSwitcher />
          </div>
        )}

        {/* Primary View */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Right Utility Rail */}
      {rightSidebar && (
        <div className="w-80 flex flex-col border-l border-gray-200 bg-white min-h-0">
          {rightSidebar}
        </div>
      )}
    </div>
  );
}

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function LeftPanel({ children, className = '' }: PanelProps) {
  return (
    <div className={`w-2/5 flex flex-col border-r border-gray-200 bg-white relative min-h-0 ${className}`}>
      {children}
    </div>
  );
}

export function CenterPanel({ children, className = '' }: PanelProps) {
  return (
    <div className={`flex-1 flex flex-col bg-gray-50 overflow-hidden min-h-0 ${className}`}>
      {children}
    </div>
  );
}

export function RightPanel({ children, className = '' }: PanelProps) {
  return (
    <div className={`w-1/4 flex flex-col border-l border-gray-200 bg-white overflow-y-auto min-h-0 ${className}`}>
      {children}
    </div>
  );
}

