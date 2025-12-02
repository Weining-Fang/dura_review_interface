import React from 'react';
import { useStore } from './useStore';
import { PrimaryView } from '../types/view';

export const useViewState = () =>
  useStore((state) => ({
    primaryView: state.primaryView,
    previousView: state.previousView,
    setPrimaryView: state.setPrimaryView,
    goToDetail: state.goToDetail,
    exitDetail: state.exitDetail,
    viewFlags: state.viewFlags,
    setViewFlags: state.setViewFlags,
  }));

export const useCanvasState = () =>
  useStore((state) => ({
    canvasSettings: state.canvasSettings,
    updateCanvasSettings: state.updateCanvasSettings,
    resetCanvasViewport: state.resetCanvasViewport,
  }));

export const useTagFilterState = () =>
  useStore((state) => ({
    tagFilters: state.tagFilters,
    setTagFilters: state.setTagFilters,
    clearTagFilters: state.clearTagFilters,
  }));

export const useSelectionState = () =>
  useStore((state) => ({
    selectedSiteIds: state.selectedSiteIds,
    setSelectedSites: state.setSelectedSites,
    addSite: state.addSite,
    removeSite: state.removeSite,
    toggleSite: state.toggleSite,
    currentImageId: state.currentImageId,
    setCurrentImageId: state.setCurrentImageId,
  }));

export const useDataState = () =>
  useStore((state) => ({
    sites: state.sites,
    images: state.images,
    filteredImageIds: state.filteredImageIds,
    setSites: state.setSites,
    setImages: state.setImages,
    setFilteredImageIds: state.setFilteredImageIds,
    annotations: state.annotations,
    setAnnotations: state.setAnnotations,
  }));

export const useFacetsState = () =>
  useStore((state) => ({
    facets: state.facets,
    setFacets: state.setFacets,
    addFacetValue: state.addFacetValue,
    removeFacetValue: state.removeFacetValue,
    clearFacets: state.clearFacets,
  }));

export const useMapState = () =>
  useStore((state) => ({
    isMapReady: state.isMapReady,
    setMapReady: state.setMapReady,
    hoveredSiteId: state.hoveredSiteId,
    setHoveredSiteId: state.setHoveredSiteId,
    nearbySites: state.nearbySites,
    setNearbySites: state.setNearbySites,
  }));

export const useDetailState = () =>
  useStore((state) => ({
    currentImageId: state.currentImageId,
    setCurrentImageId: state.setCurrentImageId,
    lastAnnotationLabel: state.lastAnnotationLabel,
    setLastAnnotationLabel: state.setLastAnnotationLabel,
  }));

export const useKeyboardNavigation = (
  handler: (key: string, view: PrimaryView) => boolean | void
) => {
  const { primaryView } = useViewState();
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const handled = handler(event.key, primaryView);
      if (handled) {
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handler, primaryView]);
};
