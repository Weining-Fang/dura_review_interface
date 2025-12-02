/**
 * Simple Context-based state management
 * Replaces Zustand to avoid infinite loop issues
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface Site {
  id: string;
  name: string;
  building_type?: string;
  geometry?: any;
  image_count?: number;
  period?: string[];
  distance_m?: number;
}

export interface Image {
  id: string;
  url: string;
  filename?: string;
  description?: string;
  season?: string;
  depict_l1?: string;
  depict_l2?: string;
  photographer?: string;
  tags?: string[];
  keywords?: string[];
  annotation_count?: number;
}

export interface Annotation {
  id: string;
  image_id: string;
  label: string;
  note?: string;
  confidence?: string;
  annotator?: string;
  geometry?: any;
}

export type View = 'map' | 'canvas' | 'gallery' | 'detail';

interface AppState {
  // Current view
  view: View;
  previousView: View | null;

  // Data
  sites: Site[];
  images: Image[];
  annotations: Annotation[];

  // Selection
  selectedSiteId: string | null;
  selectedImageId: string | null;

  // Search
  searchQuery: string;
}

type Action =
  | { type: 'SET_VIEW'; view: View }
  | { type: 'GO_TO_DETAIL'; imageId: string }
  | { type: 'EXIT_DETAIL' }
  | { type: 'SET_SITES'; sites: Site[] }
  | { type: 'SET_IMAGES'; images: Image[] }
  | { type: 'SET_ANNOTATIONS'; annotations: Annotation[] }
  | { type: 'SELECT_SITE'; siteId: string }
  | { type: 'SELECT_IMAGE'; imageId: string }
  | { type: 'SET_SEARCH_QUERY'; query: string };

const initialState: AppState = {
  view: 'map',
  previousView: null,
  sites: [],
  images: [],
  annotations: [],
  selectedSiteId: null,
  selectedImageId: null,
  searchQuery: '',
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return {
        ...state,
        previousView: state.view,
        view: action.view,
      };

    case 'GO_TO_DETAIL':
      return {
        ...state,
        previousView: state.view,
        view: 'detail',
        selectedImageId: action.imageId,
      };

    case 'EXIT_DETAIL':
      return {
        ...state,
        view: state.previousView || 'gallery',
        previousView: null,
      };

    case 'SET_SITES':
      return { ...state, sites: action.sites };

    case 'SET_IMAGES':
      return { ...state, images: action.images };

    case 'SET_ANNOTATIONS':
      return { ...state, annotations: action.annotations };

    case 'SELECT_SITE':
      return { ...state, selectedSiteId: action.siteId };

    case 'SELECT_IMAGE':
      return { ...state, selectedImageId: action.imageId };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}

// Convenience hooks
export function useView() {
  const { state, dispatch } = useAppState();
  return {
    view: state.view,
    previousView: state.previousView,
    setView: (view: View) => dispatch({ type: 'SET_VIEW', view }),
    goToDetail: (imageId: string) => dispatch({ type: 'GO_TO_DETAIL', imageId }),
    exitDetail: () => dispatch({ type: 'EXIT_DETAIL' }),
  };
}

export function useData() {
  const { state, dispatch } = useAppState();
  return {
    sites: state.sites,
    images: state.images,
    annotations: state.annotations,
    setSites: (sites: Site[]) => dispatch({ type: 'SET_SITES', sites }),
    setImages: (images: Image[]) => dispatch({ type: 'SET_IMAGES', images }),
    setAnnotations: (annotations: Annotation[]) => dispatch({ type: 'SET_ANNOTATIONS', annotations }),
  };
}

export function useSelection() {
  const { state, dispatch } = useAppState();
  return {
    selectedSiteId: state.selectedSiteId,
    selectedImageId: state.selectedImageId,
    selectSite: (siteId: string) => dispatch({ type: 'SELECT_SITE', siteId }),
    selectImage: (imageId: string) => dispatch({ type: 'SELECT_IMAGE', imageId }),
  };
}

export function useSearch() {
  const { state, dispatch } = useAppState();
  return {
    searchQuery: state.searchQuery,
    setSearchQuery: (query: string) => dispatch({ type: 'SET_SEARCH_QUERY', query }),
  };
}
