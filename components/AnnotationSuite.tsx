import React, { useMemo, useState } from 'react';
import AnnotationEditor from './AnnotationEditor';
import AnnotationList from './AnnotationList';
import MetadataCard from './MetadataCard';
import SelectedImagePreview from './SelectedImagePreview';
import { useStore } from '../store/useStore';
import { useImageAnnotations } from '../hooks/useImageAnnotations';

export default function AnnotationSuite() {
  const { currentImageId, images, setViewMode, openAnnotationModal } = useStore();
  const image = useMemo(
    () => (currentImageId ? images.find((img) => img.id === currentImageId) || null : null),
    [currentImageId, images]
  );

  const { annotations, isLoading, error, refresh } = useImageAnnotations(currentImageId);
  const [showDrawer, setShowDrawer] = useState(false);
  const [tool, setTool] = useState<'rect' | 'ellipse'>('rect');
  const [color, setColor] = useState<string>('#ef4444');

  const palette = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'];

  if (!image) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 px-4">
        <div className="text-center space-y-1">
          <div className="text-sm font-medium">Select an image to annotate</div>
          <div className="text-xs text-gray-400">Choose a thumbnail in the schematic or gallery.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-3 bg-white">
        <div className="min-w-0">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Annotation suite</div>
          <div className="text-sm font-semibold text-gray-900 truncate" title={image.description || image.filename}>
            {image.description || image.filename}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
            {isLoading && <span className="ml-2 text-blue-600">Loading…</span>}
          </div>
          {error && <div className="text-xs text-red-600 mt-1">Failed to load annotations</div>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowDrawer((v) => !v)}
            className="px-3 py-1.5 text-xs rounded bg-gray-900 text-white hover:bg-gray-800"
          >
            {showDrawer ? 'Hide drawing' : 'Draw here'}
          </button>
          <button
            onClick={() => openAnnotationModal(image.id)}
            className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Open workspace
          </button>
        </div>
      </div>

      {/* Tool and color controls */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Tool</span>
            <button
              onClick={() => setTool('rect')}
              className={`px-2.5 py-1 text-xs rounded ${
                tool === 'rect' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              Rectangle
            </button>
            <button
              onClick={() => setTool('ellipse')}
              className={`px-2.5 py-1 text-xs rounded ${
                tool === 'ellipse' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              Ellipse
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Color</span>
            <div className="flex items-center gap-1">
              {palette.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    color === c ? 'border-gray-800' : 'border-transparent'
                  } hover:scale-105 transition-transform`}
                  style={{ backgroundColor: c }}
                  aria-label={`Use color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center gap-2">
        <button
          onClick={refresh}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
        >
          Refresh annotations
        </button>
        <button
          onClick={() => setViewMode('detail')}
          className="px-3 py-1.5 text-xs rounded bg-gray-900 text-white hover:bg-gray-800"
        >
          Open detail view
        </button>
      </div>

      {/* Preview + metadata + list */}
      <div className="flex-1 overflow-y-auto">
        <SelectedImagePreview />
        <MetadataCard image={image} />
        <AnnotationList annotations={annotations} />
      </div>

      {/* Embedded drawer editor */}
      {showDrawer && (
        <div className="border-t border-gray-200 bg-gray-900">
          <div className="h-[420px]">
            <AnnotationEditor
              imageUrl={image.url}
              imageId={image.id}
              existingAnnotations={annotations}
              onSave={async () => {
                await refresh();
              }}
              onClose={() => setShowDrawer(false)}
              initialTool={tool}
              initialColor={color}
              onColorChange={setColor}
            />
          </div>
        </div>
      )}
    </div>
  );
}


