/**
 * IIIFViewer Component - Simple IIIF image viewer with zoom/pan
 * Uses basic HTML/CSS for MVP, can be replaced with Mirador later
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import AnnotationEditor from './AnnotationEditor';
import { useAnnotations } from '../hooks/useAnnotations';

interface IIIFViewerProps {
  imageId: string;
  onClose?: () => void;
}

export default function IIIFViewer({ imageId, onClose }: IIIFViewerProps) {
  const { images } = useStore();
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showEditor, setShowEditor] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const image = images.find(img => img.id === imageId);

  // Fetch IIIF manifest and annotations
  const {
    annotations,
    loading: annotationsLoading,
    error: annotationsError,
    refresh: refreshAnnotations
  } = useAnnotations(imageId);

  useEffect(() => {
    if (!imageId) return;

    setLoading(true);

    fetch(`/api/iiif/${imageId}/manifest.json`)
      .then(r => r.json())
      .then((manifestData) => {
        setManifest(manifestData);
      })
      .catch(err => {
        console.error('Error loading IIIF manifest:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [imageId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showEditor) {
          setShowEditor(false);
        } else if (onClose) {
          onClose();
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(z * 1.2, 5));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(z / 1.2, 1));
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showEditor]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  type NormalizedGeometry =
    | { type: 'rect'; x: number; y: number; w: number; h: number }
    | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number };

  interface OverlayAnnotation {
    id: string;
    label: string;
    geom: NormalizedGeometry;
  }

  const overlayAnnotations = useMemo<OverlayAnnotation[]>(() => {
    if (!annotations) return [];
    return annotations
      .map((annot) => {
        if (!annot.geometry) return null;
        let geom: any = annot.geometry;
        if (typeof geom === 'string') {
          try {
            geom = JSON.parse(geom);
          } catch (err) {
            console.warn('Failed to parse annotation geometry', err);
            return null;
          }
        }
        if (!geom) return null;
        if (geom.type === 'ellipse') {
          return {
            id: annot.id,
            label: annot.label,
            geom: {
              type: 'ellipse',
              cx: geom.cx ?? 0,
              cy: geom.cy ?? 0,
              rx: geom.rx ?? 0,
              ry: geom.ry ?? 0
            } as NormalizedGeometry
          };
        }
        return {
          id: annot.id,
          label: annot.label,
          geom: {
            type: 'rect',
            x: geom.x ?? 0,
            y: geom.y ?? 0,
            w: geom.w ?? 0,
            h: geom.h ?? 0
          } as NormalizedGeometry
        };
      })
      .filter((entry): entry is OverlayAnnotation => Boolean(entry));
  }, [annotations]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(1, Math.min(z * delta, 5)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-gray-600">Loading image...</div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-gray-600">Image not found</div>
      </div>
    );
  }

  const handleAnnotationSave = async () => {
    try {
      await refreshAnnotations();
      showToast('Annotations updated');
    } catch (err) {
      console.error('Error refreshing annotations after save:', err);
      showToast('Failed to refresh annotations');
    }
  };

  // Show annotation editor if enabled
  if (showEditor) {
    return (
      <AnnotationEditor
        imageUrl={image.url}
        imageId={imageId}
        existingAnnotations={annotations}
        onSave={handleAnnotationSave}
        onClose={() => setShowEditor(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 relative">
      {toast && (
        <div className="absolute top-4 right-4 z-50 px-4 py-2 bg-white/95 text-gray-800 text-sm rounded shadow">
          {toast}
        </div>
      )}
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onClose && onClose()}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            ← Back to Schematic
          </button>
          
          <div className="text-sm text-gray-300">
            {image.description || image.filename}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditor(true)}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold"
          >
            ✏️ Edit Annotations
          </button>

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
              onClick={() => setZoom(z => Math.max(z / 1.2, 1))}
              className="px-2 py-1 hover:bg-gray-600 rounded text-lg"
            >
              −
            </button>
            <span className="px-2 text-sm">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(z * 1.2, 5))}
              className="px-2 py-1 hover:bg-gray-600 rounded text-lg"
            >
              +
            </button>
          </div>

          <button
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Reset
          </button>

          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Download
          </a>
        </div>
      </div>

      {/* Image viewer */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <div className="relative">
            <img
              ref={imageRef}
              src={image.url}
              alt={image.description || ''}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
            {showAnnotations && overlayAnnotations.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {overlayAnnotations.map(({ id, label, geom }) => {
                  if (geom.type === 'rect') {
                    return (
                      <div
                        key={id}
                        className="absolute border-2 border-blue-500/80 bg-blue-500/10 rounded-sm"
                        style={{
                          left: `${geom.x * 100}%`,
                          top: `${geom.y * 100}%`,
                          width: `${geom.w * 100}%`,
                          height: `${geom.h * 100}%`
                        }}
                      >
                        {label && (
                          <span className="absolute -top-5 left-0 text-[10px] font-semibold bg-blue-600 text-white px-1 py-0.5 rounded">
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={id}
                      className="absolute border-2 border-blue-400/90 bg-blue-400/10 rounded-full"
                      style={{
                        left: `${(geom.cx - geom.rx) * 100}%`,
                        top: `${(geom.cy - geom.ry) * 100}%`,
                        width: `${geom.rx * 2 * 100}%`,
                        height: `${geom.ry * 2 * 100}%`
                      }}
                    >
                      {label && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-blue-600 text-white px-1 py-0.5 rounded">
                          {label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Annotations list */}
      {showAnnotations && (annotations.length > 0 || annotationsLoading || Boolean(annotationsError)) && (
        <div className="absolute top-20 right-4 w-64 bg-white rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Annotations</h3>
            <button
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => refreshAnnotations().catch(() => undefined)}
              disabled={annotationsLoading}
            >
              {annotationsLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {annotationsError && (
            <div className="px-3 py-2 text-xs text-red-600 border-b border-red-100 bg-red-50">
              {annotationsError}
            </div>
          )}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
            {annotationsLoading && (
              <div className="p-3 text-sm text-gray-500">Loading annotations…</div>
            )}
            {!annotationsLoading && annotations.length === 0 && !annotationsError && (
              <div className="p-3 text-sm text-gray-500">No annotations yet.</div>
            )}
            {!annotationsLoading && annotations.map((annot) => (
              <div key={annot.id} className="p-3">
                <div className="text-sm font-medium text-gray-900">{annot.label}</div>
                {annot.note && (
                  <div className="text-xs text-gray-600 mt-1">{annot.note}</div>
                )}
                {annot.confidence && (
                  <div className="text-xs text-gray-500 mt-1">
                    Confidence: {annot.confidence}
                  </div>
                )}
                {annot.annotator && (
                  <div className="text-xs text-gray-400 mt-1">
                    By: {annot.annotator}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="px-4 py-2 bg-gray-800 text-xs text-gray-400 flex gap-4">
        <span>Esc: Back to gallery</span>
        <span>+/−: Zoom</span>
        <span>0: Reset view</span>
        <span>Drag to pan</span>
      </div>
    </div>
  );
}

