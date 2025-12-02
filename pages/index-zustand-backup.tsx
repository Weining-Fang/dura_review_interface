/**
 * Main Application Page - Three-View Architecture
 * Map / Canvas / Gallery with Detail overlay
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useStore } from '../store/useStore';
import Layout from '../components/Layout';
import MapView from '../components/MapView';
import SiteSchematic from '../components/SiteSchematic';
import Gallery from '../components/Gallery';
import IIIFViewer from '../components/IIIFViewer';
import GlobalSearchBar from '../components/GlobalSearchBar';
import SelectedImagePreview from '../components/SelectedImagePreview';
import MetadataCard from '../components/MetadataCard';
import AnnotationList from '../components/AnnotationList';
import MapSidebar from '../components/map/MapSidebar';
import GallerySidebar from '../components/gallery/GallerySidebar';

export default function Home() {
  // Only subscribe to state values, NOT actions
  const primaryView = useStore((state) => state.primaryView);
  const selectedSiteIds = useStore((state) => state.selectedSiteIds);
  const currentImageId = useStore((state) => state.currentImageId);
  const images = useStore((state) => state.images);
  const filteredImageIds = useStore((state) => state.filteredImageIds);
  const facets = useStore((state) => state.facets);
  const tagFilters = useStore((state) => state.tagFilters);
  const annotations = useStore((state) => state.annotations);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial sites data
  useEffect(() => {
    setLoading(true);
    fetch('/api/sites?with_images=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.sites) {
          useStore.getState().setSites(data.sites);
          console.log('Loaded', data.sites.length, 'sites');
        }
      })
      .catch((err) => {
        console.error('Error loading sites:', err);
        setError('Failed to load sites. Please check your database connection.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Load images for selected site
  const loadSiteImages = useCallback((siteId: string) => {
    fetch(`/api/sites/${siteId}/images?with_annotations=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.images) {
          const store = useStore.getState();
          store.setImages(data.images);
          store.setFilteredImageIds(data.images.map((img: any) => img.id));
        }
      })
      .catch((err) => console.error('Error loading images:', err));
  }, []);

  // Handle site selection from map
  const handleSiteSelect = useCallback((siteId: string) => {
    const store = useStore.getState();
    store.setSelectedSites([siteId]);
    loadSiteImages(siteId);
    store.setPrimaryView('canvas');
  }, [loadSiteImages]);

  // Apply filters when facets or tag filters change
  useEffect(() => {
    if (images.length === 0) return;
    let filtered = [...images];

    // Search query filter
    if (facets.searchQuery.trim()) {
      const query = facets.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (img) =>
          (img.description || '').toLowerCase().includes(query) ||
          (img.filename || '').toLowerCase().includes(query) ||
          (img.depict_l2 || '').toLowerCase().includes(query) ||
          (img.tags || img.keywords || []).some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Season filter
    if (facets.seasons.length > 0) {
      filtered = filtered.filter(
        (img) => img.season && facets.seasons.includes(img.season)
      );
    }

    // Annotation filter
    if (facets.hasAnnotations) {
      filtered = filtered.filter(
        (img) => img.annotation_count !== undefined && img.annotation_count > 0
      );
    }

    // Tag filters
    if (tagFilters.imageTags.length > 0) {
      filtered = filtered.filter((img) => {
        const tags = img.tags || img.keywords || [];
        return tagFilters.imageTags.every((tag) => tags.includes(tag));
      });
    }

    // Metadata filters
    if (tagFilters.metadata.seasons.length > 0) {
      filtered = filtered.filter(
        (img) => img.season && tagFilters.metadata.seasons.includes(img.season)
      );
    }

    if (tagFilters.metadata.depict.length > 0) {
      filtered = filtered.filter(
        (img) => img.depict_l1 && tagFilters.metadata.depict.includes(img.depict_l1)
      );
    }

    if (tagFilters.metadata.photographer.length > 0) {
      filtered = filtered.filter(
        (img) => img.photographer && tagFilters.metadata.photographer.includes(img.photographer)
      );
    }

    useStore.getState().setFilteredImageIds(filtered.map((img) => img.id));
  }, [images, facets, tagFilters]);

  // Load annotations for current image
  useEffect(() => {
    if (!currentImageId) {
      useStore.getState().setAnnotations([]);
      return;
    }
    fetch(`/api/annotations?image_id=${currentImageId}`)
      .then((res) => res.json())
      .then((data) => useStore.getState().setAnnotations(data.annotations || []))
      .catch(() => useStore.getState().setAnnotations([]));
  }, [currentImageId]);

  // Get current image
  const currentImage = currentImageId
    ? images.find((img) => img.id === currentImageId)
    : null;

  // Filter images for display
  const displayImages = useMemo(
    () => images.filter((img) => filteredImageIds.includes(img.id)),
    [images, filteredImageIds]
  );

  // Render primary view based on state
  const renderPrimaryView = () => {
    if (primaryView === 'detail' && currentImageId) {
      return <IIIFViewer imageId={currentImageId} />;
    }

    if (primaryView === 'map') {
      return <MapView onSiteSelect={handleSiteSelect} />;
    }

    if (primaryView === 'canvas') {
      if (selectedSiteIds.length === 0) {
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No site selected</p>
              <p className="text-sm">Select a site from the map to view its canvas</p>
              <button
                onClick={() => useStore.getState().setPrimaryView('map')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Map
              </button>
            </div>
          </div>
        );
      }
      return (
        <SiteSchematic
          siteId={selectedSiteIds[0]}
          images={displayImages}
          onImageSelect={(id) => useStore.getState().setCurrentImageId(id)}
        />
      );
    }

    // Gallery view
    return <Gallery images={displayImages} onImageSelect={(id) => useStore.getState().setCurrentImageId(id)} />;
  };

  // Render left sidebar based on view
  const renderLeftSidebar = () => {
    if (primaryView === 'detail') return null;

    if (primaryView === 'map' || primaryView === 'canvas') {
      return <MapSidebar onSiteSelect={handleSiteSelect} />;
    }

    if (primaryView === 'gallery') {
      return <GallerySidebar images={images} />;
    }

    return null;
  };

  // Right sidebar (always visible except in detail mode)
  const renderRightSidebar = () => {
    if (primaryView === 'detail') return null;

    return (
      <div className="flex h-full flex-col">
        <GlobalSearchBar />
        <div className="flex-1 overflow-y-auto">
          <SelectedImagePreview />
          <MetadataCard image={currentImage} />
          <AnnotationList annotations={annotations} />
        </div>
      </div>
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
          <div className="rounded bg-gray-100 p-3 text-left text-xs text-gray-500">
            <p className="mb-2">Make sure you have:</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Run the SQL setup (`sql/01_setup_postgis.sql`).</li>
              <li>Run the migration (`node scripts/migrate_data.js`).</li>
              <li>Configured environment variables in `.env.local`.</li>
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
        <meta
          name="description"
          content="Interactive spatial research interface for Dura-Europos archaeological data"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout
        leftSidebar={renderLeftSidebar()}
        rightSidebar={renderRightSidebar()}
        showViewSwitcher={primaryView !== 'detail'}
      >
        {renderPrimaryView()}
      </Layout>

      <style jsx global>{`
        .maplibregl-popup-content {
          padding: 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .maplibregl-popup-close-button {
          display: none;
        }
      `}</style>
    </>
  );
}
