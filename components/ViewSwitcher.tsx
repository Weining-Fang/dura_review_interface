/**
 * ViewSwitcher - Top-level navigation between Map, Canvas, and Gallery
 * Includes keyboard shortcuts: M (map), C (canvas), G (gallery), ESC (navigate back)
 */

import React from 'react';
import { useViewState, useSelectionState } from '../store/hooks';
import { PrimaryView } from '../types/view';

export default function ViewSwitcher() {
  const { primaryView, setPrimaryView, exitDetail } = useViewState();
  const { selectedSiteIds } = useSelectionState();

  const views: { key: PrimaryView; label: string; shortcut: string; disabled?: boolean }[] = [
    { key: 'map', label: 'Map', shortcut: 'M' },
    { key: 'canvas', label: 'Canvas', shortcut: 'C', disabled: selectedSiteIds.length === 0 },
    { key: 'gallery', label: 'Gallery', shortcut: 'G' },
  ];

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      // ESC to exit detail or navigate back
      if (e.key === 'Escape') {
        if (primaryView === 'detail') {
          exitDetail();
          e.preventDefault();
        }
        return;
      }

      // View shortcuts (only when not in detail)
      if (primaryView !== 'detail') {
        if (e.key.toLowerCase() === 'm') {
          setPrimaryView('map');
          e.preventDefault();
        } else if (e.key.toLowerCase() === 'c' && selectedSiteIds.length > 0) {
          setPrimaryView('canvas');
          e.preventDefault();
        } else if (e.key.toLowerCase() === 'g') {
          setPrimaryView('gallery');
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // Zustand actions are stable, only include state values in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryView, selectedSiteIds]);

  // Don't show switcher in detail view
  if (primaryView === 'detail') {
    return null;
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
      {views.map((view) => (
        <button
          key={view.key}
          onClick={() => setPrimaryView(view.key)}
          disabled={view.disabled}
          className={`
            px-4 py-1.5 rounded-md text-sm font-medium transition-all
            ${
              primaryView === view.key
                ? 'bg-white text-gray-900 shadow-sm'
                : view.disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
          title={view.disabled ? 'Select a site first' : `Switch to ${view.label} (${view.shortcut})`}
        >
          <span>{view.label}</span>
          <span className="ml-2 text-xs opacity-60">{view.shortcut}</span>
        </button>
      ))}
    </div>
  );
}
