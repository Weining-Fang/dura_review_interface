/**
 * Canvas View - Site schematic with zoom/pan using react-zoom-pan-pinch
 * Simplified version that lets the library handle all zoom/pan state
 */

import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useData, useSelection, useView, Image } from '../lib/AppContext';

export default function CanvasView() {
  const { images } = useData();
  const { selectedSiteId, selectedImageId, selectImage } = useSelection();
  const { goToDetail } = useView();
  const [searchFilter, setSearchFilter] = useState('');

  // Filter images by search
  const filteredImages = images.filter(img => {
    if (!searchFilter) return true;
    const query = searchFilter.toLowerCase();
    return (
      (img.description || '').toLowerCase().includes(query) ||
      (img.filename || '').toLowerCase().includes(query) ||
      (img.season || '').toLowerCase().includes(query)
    );
  });

  if (!selectedSiteId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">No site selected</p>
          <p className="text-sm mt-2">Select a site from the map to view its canvas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filter images..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Canvas with zoom/pan */}
      <div className="flex-1 relative overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit
          wheel={{ step: 0.1 }}
          doubleClick={{ mode: 'reset' }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom controls */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
                <button
                  onClick={() => zoomIn()}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold"
                  title="Zoom in"
                >
                  +
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold"
                  title="Zoom out"
                >
                  −
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                  title="Reset view"
                >
                  Reset
                </button>
              </div>

              {/* Scrollable canvas content */}
              <TransformComponent
                wrapperClass="w-full h-full"
                contentClass="w-full h-full flex items-center justify-center"
              >
                <div className="p-8">
                  {/* Grid layout of images */}
                  <div className="grid grid-cols-4 gap-4 auto-rows-min">
                    {filteredImages.map((image) => (
                      <div
                        key={image.id}
                        className={`relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all ${
                          selectedImageId === image.id
                            ? 'ring-4 ring-blue-500'
                            : 'hover:shadow-lg'
                        }`}
                        onClick={() => selectImage(image.id)}
                        onDoubleClick={() => goToDetail(image.id)}
                      >
                        {/* Thumbnail */}
                        <div className="aspect-square bg-gray-100">
                          <img
                            src={image.url}
                            alt={image.description || image.filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Metadata */}
                        <div className="p-2 bg-white">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {image.description || image.filename}
                          </div>
                          {image.season && (
                            <div className="text-xs text-gray-500 mt-1">
                              {image.season}
                            </div>
                          )}
                        </div>

                        {/* Annotation badge */}
                        {image.annotation_count && image.annotation_count > 0 && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {image.annotation_count}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {filteredImages.length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                      <p>No images match your filter</p>
                    </div>
                  )}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Hints */}
      <div className="px-4 py-2 bg-white border-t border-gray-200 text-xs text-gray-500 flex gap-4">
        <span>Click to select</span>
        <span>Double-click for detail view</span>
        <span>Scroll to zoom</span>
        <span>Drag to pan</span>
      </div>
    </div>
  );
}
