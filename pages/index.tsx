/**
 * Main Application Page - Dura-Europos Spatial Research Interface
 * Three-panel coordinated view system with map, gallery, and facets
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useStore } from '../store/useStore';
import MapView from '../components/MapView';
import Gallery from '../components/Gallery';
import SiteSchematic from '../components/SiteSchematic';
import SearchBar from '../components/SearchBar';
import SelectedImagePreview from '../components/SelectedImagePreview';
import ContextPane from '../components/ContextPane';
import ComparisonStrip from '../components/ComparisonStrip';
import MetadataImageViewer from '../components/MetadataImageViewer';
import AnnotationModal from '../components/AnnotationModal';

export default function Home() {
  const {
    viewMode,
    appStage,
    selectedSiteIds,
    currentImageId,
    sites,
    images,
    filteredImageIds,
    facets,
    setSites,
    setImages,
    setFilteredImageIds,
    setSelectedSites,
    setCurrentImageId,
    setAppStage,
    openAnnotationModal
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    setLoading(true);
    
    fetch('/api/sites?with_images=true')
      .then(res => res.json())
      .then(data => {
        if (data.sites) {
          setSites(data.sites);
          console.log('Loaded', data.sites.length, 'sites');
        }
      })
      .catch(err => {
        console.error('Error loading sites:', err);
        setError('Failed to load sites. Please check your database connection.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setSites]);

  // Handle site selection from map
  const handleSiteSelect = (siteId: string) => {
    setSelectedSites([siteId]);
    loadSiteImages(siteId);
    setAppStage('images');
  };

  // Load images for selected sites
  const loadSiteImages = (siteId: string) => {
    fetch(`/api/sites/${siteId}/images?with_annotations=true`)
      .then(res => res.json())
      .then(data => {
        if (data.images) {
          setImages(data.images);
          setFilteredImageIds(data.images.map((img: any) => img.id));
          console.log('Loaded', data.images.length, 'images for site', siteId);
        }
      })
      .catch(err => {
        console.error('Error loading images:', err);
      });
  };

  // Apply filters when facets change
  useEffect(() => {
    if (images.length === 0) return;

    let filtered = [...images];

    // Apply search filter
    if (facets.searchQuery.trim()) {
      const query = facets.searchQuery.toLowerCase();
      filtered = filtered.filter(img =>
        (img.description || '').toLowerCase().includes(query) ||
        (img.filename || '').toLowerCase().includes(query) ||
        (img.depict_l2 || '').toLowerCase().includes(query) ||
        (img.keywords || []).some(k => k.toLowerCase().includes(query))
      );
    }

    // Apply season filter
    if (facets.seasons.length > 0) {
      filtered = filtered.filter(img => 
        img.season && facets.seasons.includes(img.season)
      );
    }

    // Apply has-annotations filter
    if (facets.hasAnnotations) {
      filtered = filtered.filter(img => 
        img.annotation_count !== undefined && img.annotation_count > 0
      );
    }

    setFilteredImageIds(filtered.map(img => img.id));
  }, [images, facets, setFilteredImageIds]);

  // Get current image for metadata display
  const currentImage = currentImageId ? images.find(img => img.id === currentImageId) : null;

  // Filter images to show in gallery
  const displayImages = images.filter(img => filteredImageIds.includes(img.id));

  // Handle back from metadata view
  const handleBackFromMetadata = () => {
    setAppStage('images');
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to clear filters/selection or go back
      if (e.key === 'Escape' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (appStage === 'metadata') {
          setAppStage('images');
        } else {
          // Clear selection
          setSelectedSites([]);
          setImages([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appStage, viewMode, setSelectedSites, setImages, setAppStage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-2">
            Loading Dura-Europos Data...
          </div>
          <div className="text-sm text-gray-600">
            Initializing spatial database and image collections
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded">
            <p className="mb-2">Make sure you have:</p>
            <ol className="text-left list-decimal list-inside space-y-1">
              <li>Run the SQL setup: <code className="bg-white px-1">sql/01_setup_postgis.sql</code></li>
              <li>Run the migration: <code className="bg-white px-1">node scripts/migrate_data.js</code></li>
              <li>Set up environment variables in <code className="bg-white px-1">.env.local</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dura-Europos Spatial Research Interface</title>
        <meta name="description" content="Interactive spatial research interface for Dura-Europos archaeological data" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {appStage === 'spatial' && (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
          <div className="flex-1 flex flex-col relative min-h-0">
            <div className="flex-1 relative min-h-0">
              <MapView onSiteSelect={handleSiteSelect} />
            </div>
            <ContextPane
              siteId={selectedSiteIds[0] || null}
              onSiteSelect={handleSiteSelect}
            />
          </div>
        </div>
      )}

      {appStage === 'images' && (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <button
              onClick={() => setAppStage('spatial')}
              className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
            >
              ← Back to map
            </button>
            <SearchBar onChange={() => { /* filter reacts via facets */ }} />
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            {selectedSiteIds.length > 1 && (
              <ComparisonStrip siteIds={selectedSiteIds} />
            )}
            <div className="flex-1 overflow-hidden">
              {selectedSiteIds.length > 0 ? (
                <SiteSchematic
                  siteId={selectedSiteIds[0]}
                  images={displayImages}
                  onImageSelect={setCurrentImageId}
                  onImageOpen={openAnnotationModal}
                />
              ) : (
                <Gallery images={displayImages} onImageSelect={setCurrentImageId} />
              )}
            </div>
            <div className="border-t border-gray-200 bg-white">
              <SelectedImagePreview />
            </div>
          </div>
        </div>
      )}

      <AnnotationModal />

      {appStage === 'metadata' && (
        <div className="h-screen w-screen overflow-hidden bg-black">
          {currentImage ? (
            <MetadataImageViewer image={currentImage} onBack={handleBackFromMetadata} />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              Select an image from the gallery to view
            </div>
          )}
        </div>
      )}

      {/* Global styles for MapLibre */}
      <style jsx global>{`
        .maplibregl-popup-content {
          padding: 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .maplibregl-popup-close-button {
          display: none;
        }
      `}</style>
    </>
  );
}

