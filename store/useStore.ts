/**
 * Global State Management with Zustand
 * Three-view architecture: Map, Canvas, Gallery
 */

import { create } from 'zustand';
import { PrimaryView, CanvasSettings, TagFilters } from '../types/view';

export interface Site {
  id: string;
  name: string;
  building_type: string;
  period: string[];
  image_count?: number;
  geometry?: any;
  distance_m?: number;
}

export interface Image {
  id: string;
  site_id: string;
  url: string;
  filename: string;
  description: string;
  season?: string;
  keywords?: string[];
  tags?: string[];
  depict_l1?: string;
  depict_l2?: string;
  annotation_count?: number;
  photographer?: string;
}

export interface Annotation {
  id: string;
  image_id: string;
  geometry: any;
  label: string;
  note?: string;
  tags?: string[];
  color?: string;
  confidence?: 'low' | 'medium' | 'high';
  annotator?: string;
  created_at?: string;
}

export interface Facets {
  buildingTypes: string[];
  periods: string[];
  seasons: string[];
  hasAnnotations: boolean;
  searchQuery: string;
}

interface AppState {
  // View state
  primaryView: PrimaryView;
  previousView: PrimaryView | null;
  setPrimaryView: (view: PrimaryView) => void;
  goToDetail: (imageId: string) => void;
  exitDetail: () => void;

  // Canvas state
  canvasSettings: CanvasSettings;
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  resetCanvasViewport: () => void;

  // Tag filters
  tagFilters: TagFilters;
  setTagFilters: (update: Partial<TagFilters>) => void;
  clearTagFilters: () => void;

  // View flags
  viewFlags: {
    showMapSidebar: boolean;
    showGallerySidebar: boolean;
    showCanvasInspector: boolean;
  };
  setViewFlags: (update: Partial<AppState['viewFlags']>) => void;

  // Selection state
  selectedSiteIds: string[];
  setSelectedSites: (ids: string[]) => void;
  addSite: (id: string) => void;
  removeSite: (id: string) => void;
  toggleSite: (id: string) => void;

  // Current items
  currentImageId: string | null;
  setCurrentImageId: (id: string | null) => void;

  // Data
  sites: Site[];
  setSites: (sites: Site[]) => void;
  
  images: Image[];
  setImages: (images: Image[]) => void;

  filteredImageIds: string[];
  setFilteredImageIds: (ids: string[]) => void;

  annotations: Annotation[];
  setAnnotations: (annotations: Annotation[]) => void;

  // Facets and filters
  facets: Facets;
  setFacets: (facets: Partial<Facets>) => void;
  addFacetValue: (category: keyof Facets, value: any) => void;
  removeFacetValue: (category: keyof Facets, value: any) => void;
  clearFacets: () => void;

  // UI state
  isMapReady: boolean;
  setMapReady: (ready: boolean) => void;

  hoveredSiteId: string | null;
  setHoveredSiteId: (id: string | null) => void;

  // Nearby sites
  nearbySites: Site[];
  setNearbySites: (sites: Site[]) => void;

  // Last annotation label (for "repeat last" shortcut)
  lastAnnotationLabel: string | null;
  setLastAnnotationLabel: (label: string | null) => void;
}

const defaultFacets: Facets = {
  buildingTypes: [],
  periods: [],
  seasons: [],
  hasAnnotations: false,
  searchQuery: '',
};

const defaultCanvasSettings: CanvasSettings = {
  viewport: { zoom: 1, offset: { x: 0, y: 0 } },
  activeTool: 'pan',
  activeColor: '#2563eb',
  showGrid: true,
  showBackground: true,
  snapToGrid: false,
  backgroundId: null,
};

const defaultTagFilters: TagFilters = {
  imageTags: [],
  annotationTags: [],
  metadata: {
    seasons: [],
    depict: [],
    photographer: [],
  },
};

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  primaryView: 'map',
  previousView: null,
  canvasSettings: defaultCanvasSettings,
  tagFilters: defaultTagFilters,
  viewFlags: {
    showMapSidebar: true,
    showGallerySidebar: true,
    showCanvasInspector: false,
  },
  selectedSiteIds: [],
  currentImageId: null,
  sites: [],
  images: [],
  filteredImageIds: [],
  annotations: [],
  facets: defaultFacets,
  isMapReady: false,
  hoveredSiteId: null,
  nearbySites: [],
  lastAnnotationLabel: null,

  // Actions
  setPrimaryView: (view) => set((state) => ({
    previousView: state.primaryView,
    primaryView: view
  })),

  goToDetail: (imageId) => {
    set((state) => ({
      currentImageId: imageId,
      previousView: state.primaryView,
      primaryView: 'detail'
    }));
  },

  exitDetail: () => {
    const state = get();
    const fallbackView: PrimaryView = state.previousView || (state.selectedSiteIds.length > 0 ? 'canvas' : 'gallery');
    set({ primaryView: fallbackView, previousView: null });
  },

  updateCanvasSettings: (settings) =>
    set((state) => ({
      canvasSettings: { ...state.canvasSettings, ...settings },
    })),

  resetCanvasViewport: () =>
    set((state) => ({
      canvasSettings: {
        ...state.canvasSettings,
        viewport: { zoom: 1, offset: { x: 0, y: 0 } },
      },
    })),

  setTagFilters: (update) =>
    set((state) => ({
      tagFilters: {
        ...state.tagFilters,
        ...update,
        metadata: {
          ...state.tagFilters.metadata,
          ...(update.metadata || {}),
        },
      },
    })),

  clearTagFilters: () => set({ tagFilters: defaultTagFilters }),

  setViewFlags: (update) =>
    set((state) => ({
      viewFlags: { ...state.viewFlags, ...update },
    })),

  setSelectedSites: (ids) => set({ selectedSiteIds: ids }),
  
  addSite: (id) => set((state) => ({
    selectedSiteIds: [...state.selectedSiteIds, id]
  })),

  removeSite: (id) => set((state) => ({
    selectedSiteIds: state.selectedSiteIds.filter(siteId => siteId !== id)
  })),

  toggleSite: (id) => set((state) => {
    const exists = state.selectedSiteIds.includes(id);
    if (exists) {
      return { selectedSiteIds: state.selectedSiteIds.filter(siteId => siteId !== id) };
    } else {
      return { selectedSiteIds: [...state.selectedSiteIds, id] };
    }
  }),

  setCurrentImageId: (id) => set({ currentImageId: id }),

  setSites: (sites) => set({ sites }),
  setImages: (images) => set({ images }),
  setFilteredImageIds: (ids) => set({ filteredImageIds: ids }),
  setAnnotations: (annotations) => set({ annotations }),

  setFacets: (newFacets) => set((state) => ({
    facets: { ...state.facets, ...newFacets }
  })),

  addFacetValue: (category, value) => set((state) => {
    const currentValues = state.facets[category];
    if (Array.isArray(currentValues)) {
      return {
        facets: {
          ...state.facets,
          [category]: [...currentValues, value]
        }
      };
    } else if (typeof currentValues === 'boolean') {
      return {
        facets: {
          ...state.facets,
          [category]: true
        }
      };
    } else {
      return {
        facets: {
          ...state.facets,
          [category]: value
        }
      };
    }
  }),

  removeFacetValue: (category, value) => set((state) => {
    const currentValues = state.facets[category];
    if (Array.isArray(currentValues)) {
      return {
        facets: {
          ...state.facets,
          [category]: currentValues.filter(v => v !== value)
        }
      };
    } else if (typeof currentValues === 'boolean') {
      return {
        facets: {
          ...state.facets,
          [category]: false
        }
      };
    } else {
      return {
        facets: {
          ...state.facets,
          [category]: ''
        }
      };
    }
  }),

  clearFacets: () => set({ facets: defaultFacets }),

  setMapReady: (ready) => set({ isMapReady: ready }),
  setHoveredSiteId: (id) => set({ hoveredSiteId: id }),
  setNearbySites: (sites) => set({ nearbySites: sites }),
  setLastAnnotationLabel: (label) => set({ lastAnnotationLabel: label }),
}));

