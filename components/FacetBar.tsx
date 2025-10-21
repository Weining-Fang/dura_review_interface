/**
 * FacetBar Component - Filters and search
 * Provides faceted filtering across building types, periods, seasons
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

interface FacetBarProps {
  onFilterChange?: () => void;
}

export default function FacetBar({ onFilterChange }: FacetBarProps) {
  const { facets, setFacets, addFacetValue, removeFacetValue, clearFacets, sites } = useStore();
  const [searchInput, setSearchInput] = useState(facets.searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFacets({ searchQuery: searchInput });
      onFilterChange?.();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setFacets, onFilterChange]);

  // Get unique values from sites
  const availableBuildingTypes = Array.from(new Set(sites.map(s => s.building_type).filter(Boolean)));
  const availablePeriods = Array.from(new Set(sites.flatMap(s => s.period || []))).sort();

  const handleBuildingTypeToggle = (type: string) => {
    if (facets.buildingTypes.includes(type)) {
      removeFacetValue('buildingTypes', type);
    } else {
      addFacetValue('buildingTypes', type);
    }
    onFilterChange?.();
  };

  const handlePeriodToggle = (period: string) => {
    if (facets.periods.includes(period)) {
      removeFacetValue('periods', period);
    } else {
      addFacetValue('periods', period);
    }
    onFilterChange?.();
  };

  const handleAnnotationsToggle = () => {
    setFacets({ hasAnnotations: !facets.hasAnnotations });
    onFilterChange?.();
  };

  const handleClearAll = () => {
    clearFacets();
    setSearchInput('');
    onFilterChange?.();
  };

  const hasActiveFilters = 
    facets.buildingTypes.length > 0 ||
    facets.periods.length > 0 ||
    facets.seasons.length > 0 ||
    facets.hasAnnotations ||
    facets.searchQuery.trim() !== '';

  // Focus search on / key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        document.getElementById('facet-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            id="facet-search"
            type="text"
            placeholder="Search images... (press /)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Facets */}
      <div className="flex-1 overflow-y-auto">
        {/* Building Types */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Building Type</h3>
          <div className="space-y-2">
            {availableBuildingTypes.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={facets.buildingTypes.includes(type)}
                  onChange={() => handleBuildingTypeToggle(type)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Periods */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Period</h3>
          <div className="space-y-2">
            {availablePeriods.map((period) => (
              <label key={period} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={facets.periods.includes(period)}
                  onChange={() => handlePeriodToggle(period)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{period}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Annotations */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Annotations</h3>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
            <input
              type="checkbox"
              checked={facets.hasAnnotations}
              onChange={handleAnnotationsToggle}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Has annotations</span>
          </label>
        </div>
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs font-semibold text-gray-700 mb-2">Active Filters:</div>
          <div className="flex flex-wrap gap-1">
            {facets.buildingTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {type}
                <button
                  onClick={() => handleBuildingTypeToggle(type)}
                  className="hover:text-blue-900"
                >
                  ✕
                </button>
              </span>
            ))}
            {facets.periods.map((period) => (
              <span
                key={period}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
              >
                {period}
                <button
                  onClick={() => handlePeriodToggle(period)}
                  className="hover:text-purple-900"
                >
                  ✕
                </button>
              </span>
            ))}
            {facets.hasAnnotations && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Annotated
                <button
                  onClick={handleAnnotationsToggle}
                  className="hover:text-green-900"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

