/**
 * Simplified Main Page
 * Uses Context instead of Zustand to avoid infinite loops
 */

import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useView, useData, useSelection, useSearch } from '../lib/AppContext';
import SimpleMapView from '../components/SimpleMapView';
import CanvasView from '../components/CanvasView';
import SimpleGallery from '../components/SimpleGallery';
import SimpleIIIFViewer from '../components/SimpleIIIFViewer';

export default function Home() {
  const { view, setView, exitDetail } = useView();
  const { sites, images, setSites, setImages, setAnnotations } = useData();
  const { selectedSiteId, selectedImageId, selectSite, selectImage } = useSelection();
  const { searchQuery } = useSearch();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial sites
  useEffect(() => {
    setLoading(true);
    fetch('/api/sites?with_images=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.sites) {
          setSites(data.sites);
          console.log('Loaded', data.sites.length, 'sites');
        }
      })
      .catch((err) => {
        console.error('Error loading sites:', err);
        setError('Failed to load sites. Please check your database connection.');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Load images when site is selected
  useEffect(() => {
    if (!selectedSiteId) {
      setImages([]);
      return;
    }

    fetch(`/api/sites/${selectedSiteId}/images?with_annotations=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.images) {
          setImages(data.images);
        }
      })
      .catch((err) => console.error('Error loading images:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId]); // Only re-run when site changes

  // Load annotations when image is selected
  useEffect(() => {
    if (!selectedImageId) {
      setAnnotations([]);
      return;
    }

    fetch(`/api/annotations?image_id=${selectedImageId}`)
      .then((res) => res.json())
      .then((data) => setAnnotations(data.annotations || []))
      .catch(() => setAnnotations([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageId]); // Only re-run when image changes

  // Handle site selection from map
  const handleSiteSelect = (siteId: string) => {
    selectSite(siteId);
    setView('canvas');
  };

  // Filter images by search
  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return images;

    const query = searchQuery.toLowerCase();
    return images.filter(
      (img) =>
        (img.description || '').toLowerCase().includes(query) ||
        (img.filename || '').toLowerCase().includes(query) ||
        (img.season || '').toLowerCase().includes(query) ||
        (img.tags || img.keywords || []).some((tag: string) =>
          tag.toLowerCase().includes(query)
        )
    );
  }, [images, searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Escape' && view === 'detail') {
        e.preventDefault();
        exitDetail();
      } else if (e.key.toLowerCase() === 'm' && view !== 'detail') {
        e.preventDefault();
        setView('map');
      } else if (e.key.toLowerCase() === 'c' && view !== 'detail' && selectedSiteId) {
        e.preventDefault();
        setView('canvas');
      } else if (e.key.toLowerCase() === 'g' && view !== 'detail') {
        e.preventDefault();
        setView('gallery');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedSiteId]); // Dispatch functions are stable, don't include them

  // Render view
  const renderView = () => {
    if (view === 'detail' && selectedImageId) {
      return <SimpleIIIFViewer imageId={selectedImageId} />;
    }

    if (view === 'map') {
      return <SimpleMapView onSiteSelect={handleSiteSelect} />;
    }

    if (view === 'canvas') {
      return <CanvasView />;
    }

    // Gallery view
    return (
      <SimpleGallery
        images={filteredImages}
        onImageSelect={(id) => selectImage(id)}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-900">Loading Dura-Europos data…</p>
          <p className="text-sm text-gray-600">Initializing spatial database and image collections</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dura-Europos Spatial Research Interface</title>
        <meta
          name="description"
          content="Interactive spatial research interface for Dura-Europos archaeological data"
        />
      </Head>

      <div className="flex flex-col h-screen">
        {/* View switcher - only show if not in detail view */}
        {view !== 'detail' && (
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setView('map')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Map (M)
              </button>
              <button
                onClick={() => setView('canvas')}
                disabled={!selectedSiteId}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'canvas'
                    ? 'bg-blue-600 text-white'
                    : selectedSiteId
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Canvas (C)
              </button>
              <button
                onClick={() => setView('gallery')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'gallery'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Gallery (G)
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {sites.length} sites • {images.length} images
            </div>
          </div>
        )}

        {/* Main view */}
        <div className="flex-1 overflow-hidden">
          {renderView()}
        </div>
      </div>
    </>
  );
}
