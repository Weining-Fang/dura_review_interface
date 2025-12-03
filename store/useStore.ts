/**
 * Global State Management with Zustand
 * Manages coordinated views: map, gallery, and facets
 */

import { create } from 'zustand';

export interface Site {
  id: string;
  name: string;
  building_type: string;
  period: string[];
  image_count?: number;
  geometry?: any;
}

export interface Image {
  id: string;
  site_id: string;
  url: string;
  filename: string;
  description: string;
  season?: string;
  keywords?: string[];
  depict_l1?: string;
  depict_l2?: string;
  annotation_count?: number;
}

export interface Annotation {
  id: string;
  image_id: string;
  geometry: any;
  label: string;
  note?: string;
  confidence?: 'low' | 'medium' | 'high';
  annotator?: string;
  created_at?: string;
}

export interface AnnotationLoadState {
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export interface Facets {
  buildingTypes: string[];
  periods: string[];
  seasons: string[];
  hasAnnotations: boolean;
  searchQuery: string;
}

export type WorkflowStep = 'map' | 'schematic' | 'annotation';

interface AppState {
  // Workflow state
  workflowStep: WorkflowStep;
  setWorkflowStep: (step: WorkflowStep) => void;
  isAnnotationOpen: boolean;
  setAnnotationOpen: (open: boolean) => void;

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
  annotationsByImage: Record<string, Annotation[]>;
  annotationStatus: Record<string, AnnotationLoadState>;
  setAnnotationsForImage: (imageId: string, annotations: Annotation[]) => void;
  setAnnotationStatus: (imageId: string, status: AnnotationLoadState) => void;
  clearAnnotationCache: (imageId?: string) => void;

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

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  workflowStep: 'map',
  isAnnotationOpen: false,
  selectedSiteIds: [],
  currentImageId: null,
  sites: [],
  images: [],
  filteredImageIds: [],
  annotations: [],
  annotationsByImage: {},
  annotationStatus: {},
  facets: defaultFacets,
  isMapReady: false,
  hoveredSiteId: null,
  nearbySites: [],
  lastAnnotationLabel: null,

  // Actions
  setWorkflowStep: (step) => set({ workflowStep: step }),
  setAnnotationOpen: (open) => set({ isAnnotationOpen: open }),

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
  setAnnotationsForImage: (imageId, annotations) => set((state) => ({
    annotationsByImage: {
      ...state.annotationsByImage,
      [imageId]: annotations
    }
  })),
  setAnnotationStatus: (imageId, status) => set((state) => ({
    annotationStatus: {
      ...state.annotationStatus,
      [imageId]: status
    }
  })),
  clearAnnotationCache: (imageId) => set((state) => {
    if (!imageId) {
      return { annotationsByImage: {}, annotationStatus: {} };
    }
    const nextAnnotations = { ...state.annotationsByImage };
    const nextStatus = { ...state.annotationStatus };
    delete nextAnnotations[imageId];
    delete nextStatus[imageId];
    return {
      annotationsByImage: nextAnnotations,
      annotationStatus: nextStatus
    };
  }),

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

