/**
 * View Type Definitions for Three-View Architecture
 * Map / Canvas / Gallery with Detail overlay
 */

export type PrimaryView = 'map' | 'canvas' | 'gallery' | 'detail';

export type AnnotationTool = 'pan' | 'select' | 'rectangle' | 'ellipse' | 'polygon' | 'freehand' | 'text';

export interface Viewport {
  zoom: number;
  offset: { x: number; y: number };
}

export interface CanvasSettings {
  viewport: Viewport;
  activeTool: AnnotationTool;
  activeColor: string;
  showGrid: boolean;
  showBackground: boolean;
  snapToGrid: boolean;
  backgroundId: string | null;
}

export interface TagFilters {
  imageTags: string[];
  annotationTags: string[];
  metadata: {
    seasons: string[];
    depict: string[];
    photographer: string[];
  };
}

export interface ViewState {
  primaryView: PrimaryView;
  previousView: PrimaryView | null; // for ESC navigation
  canvasSettings: CanvasSettings;
  tagFilters: TagFilters;
}
