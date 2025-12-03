/**
 * MetadataImageViewer Component - High-quality image viewer with zoom
 * Uses OpenSeadragon for better image handling and zoom capabilities
 */

import React from 'react';
import { Image } from '../store/useStore';
import OSDViewer from './OSDViewer';

interface MetadataImageViewerProps {
  image: Image | null;
  onBack?: () => void;
}

export default function MetadataImageViewer({ image, onBack }: MetadataImageViewerProps) {
  if (!image) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center space-y-2 text-white">
          <div>Image unavailable</div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              Back to Gallery
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Toolbar with back button and metadata */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
              >
                ← Back
              </button>
            )}
            <div className="text-white">
              <div className="text-sm font-semibold">{image.description || image.filename}</div>
              <div className="text-xs text-gray-300 mt-1 flex gap-3">
                {image.season && <span>Season: {image.season}</span>}
                {image.depict_l1 && <span>Type: {image.depict_l1}</span>}
                {image.annotation_count !== undefined && (
                  <span>Annotations: {image.annotation_count}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OpenSeadragon Viewer for high-quality zoom and pan */}
      <OSDViewer imageUrl={image.url} />

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/70 text-white text-xs px-3 py-2 rounded">
        <div>Scroll to zoom • Click & drag to pan</div>
      </div>
    </div>
  );
}

