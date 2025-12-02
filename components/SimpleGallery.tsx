/**
 * Simplified Gallery - Uses Context instead of Zustand
 */

import React, { useState } from 'react';
import { useView, useSelection, Image } from '../lib/AppContext';

interface GalleryProps {
  images?: Image[];
  onImageSelect?: (imageId: string) => void;
}

export default function SimpleGallery({ images = [], onImageSelect }: GalleryProps) {
  const { goToDetail } = useView();
  const { selectedImageId, selectImage } = useSelection();
  const [sortBy, setSortBy] = useState<'filename' | 'season' | 'annotations'>('filename');

  const sortedImages = React.useMemo(() => {
    return [...images].sort((a, b) => {
      switch (sortBy) {
        case 'season':
          return (a.season || '').localeCompare(b.season || '');
        case 'annotations':
          return (b.annotation_count || 0) - (a.annotation_count || 0);
        case 'filename':
        default:
          return (a.filename || '').localeCompare(b.filename || '');
      }
    });
  }, [images, sortBy]);

  const handleImageClick = (imageId: string) => {
    selectImage(imageId);
    if (onImageSelect) {
      onImageSelect(imageId);
    }
  };

  const handleImageDoubleClick = (imageId: string) => {
    goToDetail(imageId);
  };

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No images found</p>
          <p className="text-sm">Select a site on the map or adjust filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="text-sm text-gray-600">
          {images.length} image{images.length !== 1 ? 's' : ''}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-600">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="filename">Filename</option>
            <option value="season">Season</option>
            <option value="annotations">Annotations</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedImages.map((image) => (
            <div
              key={image.id}
              id={`image-${image.id}`}
              className={`group relative bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                selectedImageId === image.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
              }`}
              onClick={() => handleImageClick(image.id)}
              onDoubleClick={() => handleImageDoubleClick(image.id)}
            >
              {/* Image */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <img
                  src={image.url}
                  alt={image.description || image.filename}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />

                {/* Annotation badge */}
                {image.annotation_count !== undefined && image.annotation_count > 0 && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                    {image.annotation_count}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="p-2">
                <div className="text-xs font-medium text-gray-900 truncate" title={image.description}>
                  {image.description || image.filename}
                </div>
                <div className="flex items-center justify-between mt-1">
                  {image.season && <span className="text-xs text-gray-500">{image.season}</span>}
                  {image.depict_l1 && (
                    <span className="text-xs text-gray-400 capitalize">{image.depict_l1}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex gap-4">
        <span>Click to select</span>
        <span>Double-click for detail view</span>
      </div>
    </div>
  );
}
