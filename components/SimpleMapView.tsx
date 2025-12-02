/**
 * Simplified MapView - Uses Context instead of Zustand
 */

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useData, useSelection, Site } from '../lib/AppContext';

interface MapViewProps {
  onSiteSelect?: (siteId: string) => void;
}

const BUILDING_TYPE_COLORS: Record<string, string> = {
  temple: '#9333ea',
  house: '#f97316',
  military: '#ef4444',
  bath: '#3b82f6',
  religious: '#8b5cf6',
  agora: '#14b8a6',
  unknown: '#6b7280',
};

export default function SimpleMapView({ onSiteSelect }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const { sites } = useData();
  const { selectedSiteId } = useSelection();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [40.7272, 34.7469],
      zoom: 15,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      console.log('Map loaded successfully');
      map.current && map.current.resize();
    });

    const handleResize = () => {
      map.current && map.current.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add sites layer
  useEffect(() => {
    if (!map.current || !mapLoaded || sites.length === 0) return;

    const mapInstance = map.current;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: sites
        .filter((site) => site.geometry)
        .map((site) => ({
          type: 'Feature',
          id: site.id,
          geometry: site.geometry,
          properties: {
            id: site.id,
            name: site.name,
            building_type: site.building_type || 'unknown',
            image_count: site.image_count || 0,
          },
        })),
    };

    if (!mapInstance.getSource('sites')) {
      mapInstance.addSource('sites', {
        type: 'geojson',
        data: geojson,
      });

      mapInstance.addLayer({
        id: 'sites-fill',
        type: 'fill',
        source: 'sites',
        paint: {
          'fill-color': [
            'match',
            ['get', 'building_type'],
            'temple',
            BUILDING_TYPE_COLORS.temple,
            'house',
            BUILDING_TYPE_COLORS.house,
            'military',
            BUILDING_TYPE_COLORS.military,
            'bath',
            BUILDING_TYPE_COLORS.bath,
            'religious',
            BUILDING_TYPE_COLORS.religious,
            'agora',
            BUILDING_TYPE_COLORS.agora,
            BUILDING_TYPE_COLORS.unknown,
          ],
          'fill-opacity': 0.5,
        },
      });

      mapInstance.addLayer({
        id: 'sites-outline',
        type: 'line',
        source: 'sites',
        paint: {
          'line-color': '#000',
          'line-width': 1,
        },
      });

      // Click handler
      mapInstance.on('click', 'sites-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const siteId = e.features[0].properties?.id;
          if (siteId && onSiteSelect) {
            onSiteSelect(siteId);
          }
        }
      });

      // Hover
      mapInstance.on('mouseenter', 'sites-fill', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', 'sites-fill', () => {
        mapInstance.getCanvas().style.cursor = '';
      });

      // Popup
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      mapInstance.on('mouseenter', 'sites-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `
              <div class="p-2">
                <div class="font-bold text-sm">${props?.name || 'Unknown'}</div>
                <div class="text-xs text-gray-600">${props?.building_type || 'unknown'}</div>
                <div class="text-xs text-gray-500">${props?.image_count || 0} images</div>
              </div>
            `
            )
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'sites-fill', () => {
        popup.remove();
      });
    } else {
      const source = mapInstance.getSource('sites') as maplibregl.GeoJSONSource;
      source.setData(geojson);
    }
  }, [mapLoaded, sites, onSiteSelect]);

  // Update selection highlight
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedSiteId) return;

    const mapInstance = map.current;
    if (mapInstance.getLayer('sites-outline')) {
      mapInstance.setPaintProperty('sites-outline', 'line-width', [
        'case',
        ['==', ['get', 'id'], selectedSiteId],
        3,
        1,
      ]);
    }
  }, [selectedSiteId, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="font-bold mb-2">Building Types</div>
        {Object.entries(BUILDING_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 mb-1">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-600">Loading map...</div>
        </div>
      )}
    </div>
  );
}
