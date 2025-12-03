import React from 'react';
import { useStore } from '../store/useStore';

export default function SelectedImagePreview() {
  const { currentImageId, images, openAnnotationModal, setAppStage } = useStore();
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
      <div className="p-3 flex gap-3">
        {/* Fixed 100x100 thumbnail */}
        <div className="flex-shrink-0 w-[100px] h-[100px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img
            src={image.url}
            alt={image.description || image.filename}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Metadata and actions */}
        <div className="flex-1 min-w-0">
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
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setAppStage('metadata')}
              className="px-3 py-1.5 text-sm rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              View Metadata
            </button>
            <button
              onClick={() => openAnnotationModal(image.id)}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Open annotation modal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


