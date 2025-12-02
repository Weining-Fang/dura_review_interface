/**
 * MapSidebar - Site selection, building type filters, and nearby sites
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useFacetsState, useMapState, useSelectionState, useViewState } from '../../store/hooks';

interface MapSidebarProps {
  onSiteSelect: (siteId: string) => void;
}

export default function MapSidebar({ onSiteSelect }: MapSidebarProps) {
  const { sites } = useStore();
  const { facets, addFacetValue, removeFacetValue } = useFacetsState();
  const { nearbySites, setNearbySites } = useMapState();
  const { selectedSiteIds, toggleSite } = useSelectionState();
  const { setPrimaryView } = useViewState();
  const [loadingNearby, setLoadingNearby] = useState(false);

  const currentSite = selectedSiteIds[0]
    ? sites.find((site) => site.id === selectedSiteIds[0])
    : null;

  useEffect(() => {
    if (!currentSite) {
      setNearbySites([]);
      return;
    }
    setLoadingNearby(true);
    fetch(`/api/sites/${currentSite.id}/nearby?limit=5`)
      .then((res) => res.json())
      .then((data) => setNearbySites(data.nearby_sites || []))
      .catch(() => setNearbySites([]))
      .finally(() => setLoadingNearby(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSite?.id]);

  const toggleBuildingType = (type: string) => {
    if (facets.buildingTypes.includes(type)) {
      removeFacetValue('buildingTypes', type);
    } else {
      addFacetValue('buildingTypes', type);
    }
  };

  const buildingTypeCounts = sites.reduce<Record<string, number>>((acc, site) => {
    if (!site.building_type) return acc;
    acc[site.building_type] = (acc[site.building_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <section className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-gray-500 tracking-widest">Selection</div>
            <div className="text-base font-semibold text-gray-900">
              {currentSite ? currentSite.name : 'No site selected'}
            </div>
          </div>
          {currentSite && (
            <div className="text-right">
              <div className="text-xs text-gray-500">{currentSite.image_count || 0} images</div>
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => setPrimaryView('canvas')}
              >
                Open Canvas →
              </button>
            </div>
          )}
        </div>
        {currentSite && (
          <div className="mt-3 space-y-1 text-xs text-gray-600">
            <div className="capitalize">{currentSite.building_type || 'Unknown type'}</div>
            {currentSite.period?.length ? (
              <div>Period: {currentSite.period.join(', ')}</div>
            ) : null}
          </div>
        )}
        {!currentSite && (
          <p className="text-xs text-gray-500 mt-2">Click a building on the map to load its data.</p>
        )}
      </section>

      <section className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-600">
            Building Types
          </h3>
          <span className="text-xs text-gray-400">{Object.keys(buildingTypeCounts).length}</span>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
          {Object.entries(buildingTypeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
              const active = facets.buildingTypes.includes(type);
              return (
                <button
                  key={type}
                  className={`w-full flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm ${
                    active
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleBuildingType(type)}
                >
                  <span className="capitalize">{type}</span>
                  <span className="text-xs">{count}</span>
                </button>
              );
            })}
        </div>
      </section>

      <section className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-600">
            Nearby Sites
          </h3>
          {currentSite && (
            <button
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => setPrimaryView('gallery')}
            >
              View Gallery
            </button>
          )}
        </div>
        {loadingNearby && (
          <p className="text-sm text-gray-500">Loading nearby sites…</p>
        )}
        {!loadingNearby && nearbySites.length === 0 && (
          <p className="text-sm text-gray-500">No nearby sites loaded yet.</p>
        )}
        <div className="space-y-2">
          {nearbySites.map((site) => {
            const isSelected = selectedSiteIds.includes(site.id);
            return (
              <div
                key={site.id}
                className={`p-3 rounded-lg border cursor-pointer ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey) {
                    toggleSite(site.id);
                  } else {
                    onSiteSelect(site.id);
                  }
                }}
              >
                <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                  <span>{site.name}</span>
                  <span className="text-xs text-gray-500">
                    {site.distance_m ? `${Math.round(site.distance_m)}m` : ''}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                  <span className="capitalize">{site.building_type || 'Unknown'}</span>
                  <span>• {site.image_count || 0} images</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
