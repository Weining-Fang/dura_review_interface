import React from 'react';
import { useStore } from '../store/useStore';

export default function SelectedImagePreview() {
  const currentImageId = useStore((state) => state.currentImageId);
  const images = useStore((state) => state.images);
  const image = currentImageId ? images.find((i) => i.id === currentImageId) : null;

  if (!image) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center px-4">
          <div className="text-sm">No image selected</div>
          <div className="text-xs mt-1">Click a thumbnail in the schematic to select</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-3">
        <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img
            src={image.url}
            alt={image.description || image.filename}
            className="w-full h-auto object-contain"
          />
        </div>
        <div className="mt-3">
          <div className="text-sm font-semibold text-gray-900 truncate" title={image.description || image.filename}>
            {image.description || image.filename}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex gap-3">
            {image.season && <span>Season: {image.season}</span>}
            {image.depict_l1 && <span>Type: {image.depict_l1}</span>}
            {image.annotation_count !== undefined && (
              <span>Annotations: {image.annotation_count}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


