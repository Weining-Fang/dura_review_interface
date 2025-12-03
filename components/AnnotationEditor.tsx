/**
 * AnnotationEditor Component
 * SVG-based annotation drawing tools extracted from public/index.html
 * Supports rectangle and ellipse drawing with labels
 */

import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

interface Shape {
  id: string;
  type: 'rect' | 'ellipse';
  geom: RectGeom | EllipseGeom;
  label: number;
  svgEl?: SVGElement;
  labelEl?: SVGTextElement;
}

interface RectGeom {
  x: number;  // normalized 0-1
  y: number;
  w: number;
  h: number;
}

interface EllipseGeom {
  cx: number;  // normalized 0-1
  cy: number;
  rx: number;
  ry: number;
}

interface AnnotationEditorProps {
  imageUrl: string;
  imageId: string;
  onSave?: (annotations: any[]) => void;
  onClose?: () => void;
  existingAnnotations?: any[];
}

export default function AnnotationEditor({
  imageUrl,
  imageId,
  onSave,
  onClose,
  existingAnnotations = []
}: AnnotationEditorProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentTool, setCurrentTool] = useState<'rect' | 'ellipse'>('rect');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempShape, setTempShape] = useState<any>(null);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [labelCounter, setLabelCounter] = useState(1);
  const [dragState, setDragState] = useState<any>(null);
  const [annotationLabel, setAnnotationLabel] = useState('');
  const [annotationNote, setAnnotationNote] = useState('');
  const [annotationConfidence, setAnnotationConfidence] = useState<'low' | 'medium' | 'high'>('medium');

  const { setLastAnnotationLabel, lastAnnotationLabel } = useStore();

  // Load existing annotations
  useEffect(() => {
    if (existingAnnotations.length > 0) {
      const loadedShapes = existingAnnotations.map((annot, idx) => {
        const geom = typeof annot.geometry === 'string' 
          ? JSON.parse(annot.geometry) 
          : annot.geometry;
        
        return {
          id: annot.id || `shape_${idx}`,
          type: geom.type || 'rect',
          geom: geom.type === 'rect' 
            ? { x: geom.x, y: geom.y, w: geom.w, h: geom.h }
            : { cx: geom.cx, cy: geom.cy, rx: geom.rx, ry: geom.ry },
          label: geom.label || idx + 1
        };
      });
      setShapes(loadedShapes);
      setLabelCounter(loadedShapes.length + 1);
    }
  }, [existingAnnotations]);

  // Redraw shapes when they change
  useEffect(() => {
    if (!overlayRef.current || !imageRef.current) return;
    redrawShapes();
  }, [shapes]);

  const getOverlayRect = () => {
    if (!overlayRef.current) return { width: 0, height: 0 };
    const rect = overlayRef.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  const positionOverlay = () => {
    const img = imageRef.current;
    const overlay = overlayRef.current;
    if (!img || !overlay) return;

    const rect = img.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.setAttribute('width', String(rect.width));
    overlay.setAttribute('height', String(rect.height));
  };

  useEffect(() => {
    positionOverlay();
    window.addEventListener('resize', positionOverlay);
    return () => window.removeEventListener('resize', positionOverlay);
  }, []);

  const redrawShapes = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    overlay.innerHTML = '';
    const r = getOverlayRect();

    shapes.forEach(shape => {
      if (shape.type === 'rect') {
        const geom = shape.geom as RectGeom;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(geom.x * r.width));
        rect.setAttribute('y', String(geom.y * r.height));
        rect.setAttribute('width', String(geom.w * r.width));
        rect.setAttribute('height', String(geom.h * r.height));
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', selectedShape?.id === shape.id ? '#3b82f6' : '#ef4444');
        rect.setAttribute('stroke-width', selectedShape?.id === shape.id ? '3' : '2');
        rect.style.cursor = 'pointer';
        rect.addEventListener('click', () => handleShapeClick(shape));
        overlay.appendChild(rect);

        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String(geom.x * r.width + (geom.w * r.width) / 2));
        label.setAttribute('y', String(geom.y * r.height + (geom.h * r.height) / 2));
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('fill', '#ef4444');
        label.setAttribute('font-size', '16');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('stroke', 'white');
        label.setAttribute('stroke-width', '3');
        label.setAttribute('paint-order', 'stroke');
        label.textContent = String(shape.label);
        label.style.cursor = 'pointer';
        label.addEventListener('click', () => handleShapeClick(shape));
        overlay.appendChild(label);

        shape.svgEl = rect;
        shape.labelEl = label;

      } else {
        const geom = shape.geom as EllipseGeom;
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', String(geom.cx * r.width));
        ellipse.setAttribute('cy', String(geom.cy * r.height));
        ellipse.setAttribute('rx', String(geom.rx * r.width));
        ellipse.setAttribute('ry', String(geom.ry * r.height));
        ellipse.setAttribute('fill', 'none');
        ellipse.setAttribute('stroke', selectedShape?.id === shape.id ? '#3b82f6' : '#ef4444');
        ellipse.setAttribute('stroke-width', selectedShape?.id === shape.id ? '3' : '2');
        ellipse.style.cursor = 'pointer';
        ellipse.addEventListener('click', () => handleShapeClick(shape));
        overlay.appendChild(ellipse);

        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String(geom.cx * r.width));
        label.setAttribute('y', String(geom.cy * r.height));
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('fill', '#ef4444');
        label.setAttribute('font-size', '16');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('stroke', 'white');
        label.setAttribute('stroke-width', '3');
        label.setAttribute('paint-order', 'stroke');
        label.textContent = String(shape.label);
        label.style.cursor = 'pointer';
        label.addEventListener('click', () => handleShapeClick(shape));
        overlay.appendChild(label);

        shape.svgEl = ellipse;
        shape.labelEl = label;
      }
    });
  };

  const handleShapeClick = (shape: Shape) => {
    setSelectedShape(shape);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setIsDrawing(true);
    setTempShape({ startX: x, startY: y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !tempShape || !overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Draw temporary shape
    const overlay = overlayRef.current;
    const tempElements = overlay.querySelectorAll('.temp-shape');
    tempElements.forEach(el => el.remove());

    const r = { width: rect.width, height: rect.height };

    if (currentTool === 'rect') {
      const x1 = Math.min(tempShape.startX, x);
      const y1 = Math.min(tempShape.startY, y);
      const w = Math.abs(x - tempShape.startX);
      const h = Math.abs(y - tempShape.startY);

      const tempRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      tempRect.classList.add('temp-shape');
      tempRect.setAttribute('x', String(x1 * r.width));
      tempRect.setAttribute('y', String(y1 * r.height));
      tempRect.setAttribute('width', String(w * r.width));
      tempRect.setAttribute('height', String(h * r.height));
      tempRect.setAttribute('fill', 'none');
      tempRect.setAttribute('stroke', '#3b82f6');
      tempRect.setAttribute('stroke-width', '2');
      tempRect.setAttribute('stroke-dasharray', '5,5');
      overlay.appendChild(tempRect);

    } else {
      const cx = (tempShape.startX + x) / 2;
      const cy = (tempShape.startY + y) / 2;
      const rx = Math.abs(x - tempShape.startX) / 2;
      const ry = Math.abs(y - tempShape.startY) / 2;

      const tempEllipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      tempEllipse.classList.add('temp-shape');
      tempEllipse.setAttribute('cx', String(cx * r.width));
      tempEllipse.setAttribute('cy', String(cy * r.height));
      tempEllipse.setAttribute('rx', String(rx * r.width));
      tempEllipse.setAttribute('ry', String(ry * r.height));
      tempEllipse.setAttribute('fill', 'none');
      tempEllipse.setAttribute('stroke', '#3b82f6');
      tempEllipse.setAttribute('stroke-width', '2');
      tempEllipse.setAttribute('stroke-dasharray', '5,5');
      overlay.appendChild(tempEllipse);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !tempShape || !overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Remove temp shape
    const tempElements = overlayRef.current.querySelectorAll('.temp-shape');
    tempElements.forEach(el => el.remove());

    // Create final shape
    let geom: RectGeom | EllipseGeom;

    if (currentTool === 'rect') {
      const x1 = Math.min(tempShape.startX, x);
      const y1 = Math.min(tempShape.startY, y);
      const w = Math.abs(x - tempShape.startX);
      const h = Math.abs(y - tempShape.startY);
      
      // Only create if minimum size
      if (w < 0.01 || h < 0.01) {
        setIsDrawing(false);
        setTempShape(null);
        return;
      }

      geom = { x: x1, y: y1, w, h };
    } else {
      const cx = (tempShape.startX + x) / 2;
      const cy = (tempShape.startY + y) / 2;
      const rx = Math.abs(x - tempShape.startX) / 2;
      const ry = Math.abs(y - tempShape.startY) / 2;

      // Only create if minimum size
      if (rx < 0.01 || ry < 0.01) {
        setIsDrawing(false);
        setTempShape(null);
        return;
      }

      geom = { cx, cy, rx, ry };
    }

    const newShape: Shape = {
      id: `shape_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: currentTool,
      geom,
      label: labelCounter
    };

    setShapes([...shapes, newShape]);
    setLabelCounter(labelCounter + 1);
    setSelectedShape(newShape);
    setIsDrawing(false);
    setTempShape(null);
  };

  const handleClear = () => {
    if (confirm('Clear all annotations?')) {
      setShapes([]);
      setLabelCounter(1);
      setSelectedShape(null);
    }
  };

  const handleDelete = () => {
    if (selectedShape) {
      setShapes(shapes.filter(s => s.id !== selectedShape.id));
      setSelectedShape(null);
    }
  };

  const handleSave = async () => {
    if (!selectedShape) {
      alert('Please select a shape and add a label');
      return;
    }

    if (!annotationLabel.trim()) {
      alert('Please enter a label for the annotation');
      return;
    }

    try {
      const annotation = {
        image_id: imageId,
        geometry: {
          type: selectedShape.type,
          ...selectedShape.geom,
          label: selectedShape.label
        },
        label: annotationLabel,
        note: annotationNote,
        confidence: annotationConfidence,
        annotator: localStorage.getItem('annotator_name') || 'anonymous'
      };

      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation)
      });

      if (!response.ok) {
        throw new Error('Failed to save annotation');
      }

      alert('Annotation saved successfully!');
      setLastAnnotationLabel(annotationLabel);
      setAnnotationLabel('');
      setAnnotationNote('');
      setSelectedShape(null);

      if (onSave) {
        const data = await response.json();
        onSave([data.annotation]);
      }
    } catch (error) {
      console.error('Error saving annotation:', error);
      alert('Failed to save annotation. Please try again.');
    }
  };

  const handleRepeatLast = () => {
    if (lastAnnotationLabel) {
      setAnnotationLabel(lastAnnotationLabel);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key.toLowerCase() === 'f' && lastAnnotationLabel) {
        e.preventDefault();
        handleRepeatLast();
      } else if (e.key === 'Escape') {
        setSelectedShape(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShape, lastAnnotationLabel]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTool('rect')}
            className={`px-3 py-1 rounded text-sm ${
              currentTool === 'rect' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Rectangle
          </button>
          <button
            onClick={() => setCurrentTool('ellipse')}
            className={`px-3 py-1 rounded text-sm ${
              currentTool === 'ellipse' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Ellipse
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Clear All
          </button>
          {selectedShape && (
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm"
            >
              Delete Selected
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">{shapes.length} annotation{shapes.length !== 1 ? 's' : ''}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Close Editor
            </button>
          )}
        </div>
      </div>

      {/* Image with overlay */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-auto bg-gray-950 flex items-center justify-center"
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Annotation target"
          className="max-w-full max-h-full object-contain"
          onLoad={positionOverlay}
          draggable={false}
        />
        <svg
          ref={overlayRef}
          className="absolute pointer-events-auto"
          style={{ left: 0, top: 0 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>

      {/* Annotation form */}
      {selectedShape && (
        <div className="bg-gray-800 text-white p-4 border-t border-gray-700">
          <h3 className="text-sm font-semibold mb-3">
            Annotating Shape #{selectedShape.label}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Label *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={annotationLabel}
                  onChange={(e) => setAnnotationLabel(e.target.value)}
                  placeholder="e.g., wall, column, doorway"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
                />
                {lastAnnotationLabel && (
                  <button
                    onClick={handleRepeatLast}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    title="Repeat last label (F key)"
                  >
                    F: "{lastAnnotationLabel}"
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Note</label>
              <textarea
                value={annotationNote}
                onChange={(e) => setAnnotationNote(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Confidence</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setAnnotationConfidence(level)}
                    className={`px-3 py-1 rounded text-sm capitalize ${
                      annotationConfidence === level
                        ? 'bg-green-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold"
            >
              Save Annotation
            </button>
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="px-4 py-2 bg-gray-800 text-xs text-gray-400 flex gap-4 border-t border-gray-700">
        <span>Draw: Click and drag</span>
        <span>Delete: Backspace/Delete</span>
        {lastAnnotationLabel && <span>F: Repeat last label</span>}
        <span>Esc: Deselect</span>
      </div>
    </div>
  );
}

