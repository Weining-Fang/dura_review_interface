/**
 * Simplified IIIF Viewer - Uses Context instead of Zustand
 */

import React, { useEffect, useState } from 'react';
import { useView, useData, Annotation } from '../lib/AppContext';

interface IIIFViewerProps {
  imageId: string;
}

export default function SimpleIIIFViewer({ imageId }: IIIFViewerProps) {
  const { exitDetail } = useView();
  const { images } = useData();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [zoom, setZoom] = useState(1);

  const image = images.find((img) => img.id === imageId);

  useEffect(() => {
    if (!imageId) return;

    setLoading(true);
    fetch(`/api/annotations?image_id=${imageId}`)
      .then((r) => r.json())
      .then((data) => setAnnotations(data.annotations || []))
      .catch(() => setAnnotations([]))
      .finally(() => setLoading(false));
  }, [imageId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitDetail();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => Math.min(z * 1.2, 5));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(z / 1.2, 1));
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitDetail]);

  if (loading || !image) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-gray-600">Loading image...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => exitDetail()}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            ← Back
          </button>

          <div className="text-sm text-gray-300">{image.description || image.filename}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`px-3 py-1 rounded text-sm ${
              showAnnotations ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Annotations ({annotations.length})
          </button>

          <div className="flex items-center gap-1 bg-gray-700 rounded px-2">
            <button
              onClick={() => setZoom((z) => Math.max(z / 1.2, 1))}
              className="px-2 py-1 hover:bg-gray-600 rounded text-lg"
            >
              −
            </button>
            <span className="px-2 text-sm">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}
              className="px-2 py-1 hover:bg-gray-600 rounded text-lg"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setZoom(1)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Image viewer */}
      <div className="flex-1 relative overflow-auto bg-gray-900 flex items-center justify-center">
        <img
          src={image.url}
          alt={image.description || ''}
          className="max-w-none"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
            transition: 'transform 0.1s ease-out',
          }}
        />
      </div>

      {/* Annotations list */}
      {showAnnotations && annotations.length > 0 && (
        <div className="absolute top-20 right-4 w-64 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Annotations</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {annotations.map((annot) => (
              <div key={annot.id} className="p-3">
                <div className="text-sm font-medium text-gray-900">{annot.label}</div>
                {annot.note && <div className="text-xs text-gray-600 mt-1">{annot.note}</div>}
                {annot.confidence && (
                  <div className="text-xs text-gray-500 mt-1">Confidence: {annot.confidence}</div>
                )}
                {annot.annotator && (
                  <div className="text-xs text-gray-400 mt-1">By: {annot.annotator}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="px-4 py-2 bg-gray-800 text-xs text-gray-400 flex gap-4">
        <span>Esc: Back</span>
        <span>+/−: Zoom</span>
        <span>0: Reset view</span>
      </div>
    </div>
  );
}
