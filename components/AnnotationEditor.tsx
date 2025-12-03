/**
 * AnnotationEditor Component
 * Drawing + metadata workflow with queued saves and deletes
 */

import React, { useRef, useEffect, useState, useReducer, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { createAnnotation, updateAnnotation, deleteAnnotation, AnnotationApiError } from '../lib/annotations';
import AnnotationList from './AnnotationList';

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

type DraftStatus = 'clean' | 'dirty' | 'saving' | 'error';

export interface AnnotationDraft {
  id: string;
  serverId?: string;
  type: 'rect' | 'ellipse';
  geom: RectGeom | EllipseGeom;
  meta: {
    label: string;
    note: string;
    confidence: 'low' | 'medium' | 'high';
    annotator?: string;
  };
  status: DraftStatus;
  isNew: boolean;
  pendingDelete: boolean;
  error?: string | null;
  sequence: number;
}

export interface EditorState {
  drafts: AnnotationDraft[];
  selectedId: string | null;
  nextSequence: number;
}

type EditorAction =
  | { type: 'LOAD_FROM_EXISTING'; payload: AnnotationDraft[] }
  | { type: 'ADD_DRAFT'; payload: AnnotationDraft }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'UPDATE_METADATA'; payload: { id: string; updates: Partial<AnnotationDraft['meta']> } }
  | { type: 'UPDATE_GEOMETRY'; payload: { id: string; geom: RectGeom | EllipseGeom } }
  | { type: 'MARK_STATUS'; payload: { id: string; status: DraftStatus; error?: string | null; serverId?: string } }
  | { type: 'MARK_PENDING_DELETE'; payload: { id: string } }
  | { type: 'REMOVE_DRAFT'; payload: { id: string } };

export const initialEditorState: EditorState = {
  drafts: [],
  selectedId: null,
  nextSequence: 1
};

const randomId = () => `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

const parseGeometry = (geometry: any): { type: 'rect' | 'ellipse'; geom: RectGeom | EllipseGeom } => {
  const parsed = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
  if (parsed?.type === 'ellipse') {
    return {
      type: 'ellipse',
      geom: {
        cx: parsed?.cx ?? 0,
        cy: parsed?.cy ?? 0,
        rx: parsed?.rx ?? 0,
        ry: parsed?.ry ?? 0
      }
    };
  }
  return {
    type: 'rect',
    geom: {
      x: parsed?.x ?? 0,
      y: parsed?.y ?? 0,
      w: parsed?.w ?? 0,
      h: parsed?.h ?? 0
    }
  };
};

const createDraftFromAnnotation = (annotation: any, sequence: number): AnnotationDraft => {
  const { type, geom } = parseGeometry(annotation.geometry);
  return {
    id: annotation.id || randomId(),
    serverId: annotation.id,
    type,
    geom,
    meta: {
      label: annotation.label || '',
      note: annotation.note || '',
      confidence: annotation.confidence || 'medium',
      annotator: annotation.annotator
    },
    status: 'clean',
    isNew: false,
    pendingDelete: false,
    error: null,
    sequence
  };
};

const geometryPayload = (draft: AnnotationDraft) => ({
  type: draft.type,
  ...draft.geom,
  label: draft.sequence
});

const getStrokeColor = (draft: AnnotationDraft, selectedId: string | null) => {
  if (draft.id === selectedId) return '#3b82f6';
  if (draft.pendingDelete) return '#9ca3af';
  switch (draft.status) {
    case 'dirty':
      return '#f97316';
    case 'saving':
      return '#0ea5e9';
    case 'error':
      return '#dc2626';
    default:
      return '#ef4444';
  }
};

export function annotationReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'LOAD_FROM_EXISTING':
      return {
        drafts: action.payload,
        selectedId: null,
        nextSequence: action.payload.length + 1
      };
    case 'ADD_DRAFT':
      return {
        drafts: [...state.drafts, action.payload],
        selectedId: action.payload.id,
        nextSequence: Math.max(state.nextSequence, action.payload.sequence + 1)
      };
    case 'SELECT':
      return { ...state, selectedId: action.payload };
    case 'UPDATE_METADATA':
      return {
        ...state,
        drafts: state.drafts.map((draft) =>
          draft.id === action.payload.id
            ? {
                ...draft,
                meta: { ...draft.meta, ...action.payload.updates },
                status: draft.pendingDelete ? draft.status : 'dirty'
              }
            : draft
        )
      };
    case 'UPDATE_GEOMETRY':
      return {
        ...state,
        drafts: state.drafts.map((draft) =>
          draft.id === action.payload.id
            ? {
                ...draft,
                geom: action.payload.geom,
                status: draft.pendingDelete ? draft.status : 'dirty'
              }
            : draft
        )
      };
    case 'MARK_STATUS':
      return {
        ...state,
        drafts: state.drafts.map((draft) =>
          draft.id === action.payload.id
            ? {
                ...draft,
                status: action.payload.status,
                error: action.payload.error ?? null,
                isNew: action.payload.status === 'clean' ? false : draft.isNew,
                pendingDelete: action.payload.status === 'clean' ? false : draft.pendingDelete,
                serverId: action.payload.serverId ?? draft.serverId
              }
            : draft
        )
      };
    case 'MARK_PENDING_DELETE':
      return {
        ...state,
        drafts: state.drafts.map((draft) =>
          draft.id === action.payload.id ? { ...draft, pendingDelete: true, status: 'dirty' } : draft
        ),
        selectedId: state.selectedId === action.payload.id ? null : state.selectedId
      };
    case 'REMOVE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.filter((draft) => draft.id !== action.payload.id),
        selectedId: state.selectedId === action.payload.id ? null : state.selectedId
      };
    default:
      return state;
  }
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
  const annotatorRef = useRef<string>('anonymous');
  const lastSyncedKey = useRef<string | null>(null);

  const [currentTool, setCurrentTool] = useState<'rect' | 'ellipse'>('rect');
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempShape, setTempShape] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, dispatch] = useReducer(annotationReducer, initialEditorState);

  const drafts = state.drafts;
  const visibleDrafts = useMemo(() => drafts.filter((draft) => !draft.pendingDelete), [drafts]);
  const selectedDraft = drafts.find((draft) => draft.id === state.selectedId) || null;
  const hasPendingChanges = useMemo(
    () => drafts.some((draft) => draft.pendingDelete || draft.status === 'dirty'),
    [drafts]
  );
  const annotationListItems = useMemo(
    () =>
      visibleDrafts.map((draft) => ({
        id: draft.id,
        label: draft.meta.label || `Shape ${draft.sequence}`,
        note: draft.meta.note,
        confidence: draft.meta.confidence,
        annotator: draft.meta.annotator
      })),
    [visibleDrafts]
  );
  const statusMap = useMemo(
    () =>
      drafts.reduce<Record<string, { status?: DraftStatus; pendingDelete?: boolean }>>((acc, draft) => {
        acc[draft.id] = { status: draft.status, pendingDelete: draft.pendingDelete };
        return acc;
      }, {}),
    [drafts]
  );

  const { setLastAnnotationLabel, lastAnnotationLabel } = useStore();

  const showBanner = (type: 'success' | 'error', message: string) => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
    setBanner({ type, message });
    bannerTimeoutRef.current = setTimeout(() => setBanner(null), 4000);
  };

  useEffect(() => {
    annotatorRef.current = localStorage.getItem('annotator_name') || 'anonymous';
  }, []);
  useEffect(() => () => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const key = existingAnnotations.map((annot) => annot.id ?? '').join('|');
    if (key === lastSyncedKey.current) return;
    if (hasPendingChanges) return;
    const converted = existingAnnotations.map((annot, idx) => createDraftFromAnnotation(annot, idx + 1));
    dispatch({ type: 'LOAD_FROM_EXISTING', payload: converted });
    lastSyncedKey.current = key;
  }, [existingAnnotations, hasPendingChanges]);

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
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.setAttribute('width', String(rect.width));
    overlay.setAttribute('height', String(rect.height));
  };

  useEffect(() => {
    positionOverlay();
    window.addEventListener('resize', positionOverlay);
    return () => window.removeEventListener('resize', positionOverlay);
  }, []);

  useEffect(() => {
    if (!overlayRef.current || !imageRef.current) return;
    redrawShapes();
  }, [visibleDrafts, selectedDraft]);

  const redrawShapes = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.innerHTML = '';
    const r = getOverlayRect();

    visibleDrafts.forEach((draft) => {
      if (draft.type === 'rect') {
        const geom = draft.geom as RectGeom;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(geom.x * r.width));
        rect.setAttribute('y', String(geom.y * r.height));
        rect.setAttribute('width', String(geom.w * r.width));
        rect.setAttribute('height', String(geom.h * r.height));
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', getStrokeColor(draft, state.selectedId));
        rect.setAttribute('stroke-width', draft.id === state.selectedId ? '3' : '2');
        rect.style.cursor = 'pointer';
        rect.addEventListener('click', () => handleShapeClick(draft));
        overlay.appendChild(rect);

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
        label.textContent = String(draft.sequence);
        label.style.cursor = 'pointer';
        label.addEventListener('click', () => handleShapeClick(draft));
        overlay.appendChild(label);
      } else {
        const geom = draft.geom as EllipseGeom;
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', String(geom.cx * r.width));
        ellipse.setAttribute('cy', String(geom.cy * r.height));
        ellipse.setAttribute('rx', String(geom.rx * r.width));
        ellipse.setAttribute('ry', String(geom.ry * r.height));
        ellipse.setAttribute('fill', 'none');
        ellipse.setAttribute('stroke', getStrokeColor(draft, state.selectedId));
        ellipse.setAttribute('stroke-width', draft.id === state.selectedId ? '3' : '2');
        ellipse.style.cursor = 'pointer';
        ellipse.addEventListener('click', () => handleShapeClick(draft));
        overlay.appendChild(ellipse);

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
        label.textContent = String(draft.sequence);
        label.style.cursor = 'pointer';
        label.addEventListener('click', () => handleShapeClick(draft));
        overlay.appendChild(label);
      }
    });
  };

  const handleShapeClick = (draft: AnnotationDraft) => {
    if (draft.pendingDelete) return;
    dispatch({ type: 'SELECT', payload: draft.id });
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
    const overlay = overlayRef.current;
    const tempElements = overlay.querySelectorAll('.temp-shape');
    tempElements.forEach((el) => el.remove());
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
    overlayRef.current.querySelectorAll('.temp-shape').forEach((el) => el.remove());

    let geom: RectGeom | EllipseGeom;
    if (currentTool === 'rect') {
      const x1 = Math.min(tempShape.startX, x);
      const y1 = Math.min(tempShape.startY, y);
      const w = Math.abs(x - tempShape.startX);
      const h = Math.abs(y - tempShape.startY);
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
      if (rx < 0.01 || ry < 0.01) {
        setIsDrawing(false);
        setTempShape(null);
        return;
      }
      geom = { cx, cy, rx, ry };
    }

    const newDraft: AnnotationDraft = {
      id: randomId(),
      type: currentTool,
      geom,
      meta: {
        label: lastAnnotationLabel || '',
        note: '',
        confidence: 'medium',
        annotator: annotatorRef.current
      },
      status: 'dirty',
      isNew: true,
      pendingDelete: false,
      error: null,
      sequence: state.nextSequence
    };

    dispatch({ type: 'ADD_DRAFT', payload: newDraft });
    setIsDrawing(false);
    setTempShape(null);
  };

  const queueDeleteDraft = (draft: AnnotationDraft) => {
    if (!draft.serverId) {
      dispatch({ type: 'REMOVE_DRAFT', payload: { id: draft.id } });
    } else {
      dispatch({ type: 'MARK_PENDING_DELETE', payload: { id: draft.id } });
    }
  };

  const handleClear = () => {
    if (!visibleDrafts.length) return;
    if (!confirm('Clear all annotations? Unsaved work will be queued for deletion.')) return;
    visibleDrafts.forEach(queueDeleteDraft);
    showBanner('success', 'Queued all annotations for deletion.');
  };

  const handleDelete = () => {
    if (!selectedDraft) return;
    if (!confirm('Delete selected annotation?')) return;
    queueDeleteDraft(selectedDraft);
  };

  const handleSaveAll = async () => {
    const queue = drafts.filter((draft) => draft.pendingDelete || draft.status === 'dirty');
    if (queue.length === 0) return;
    setIsSaving(true);
    const saved: any[] = [];
    let deleteCount = 0;
    let errorCount = 0;

    for (const draft of queue) {
      try {
        if (draft.pendingDelete) {
          if (draft.serverId) {
            dispatch({ type: 'MARK_STATUS', payload: { id: draft.id, status: 'saving', error: null } });
            await deleteAnnotation(draft.serverId);
          }
          dispatch({ type: 'REMOVE_DRAFT', payload: { id: draft.id } });
          deleteCount++;
          continue;
        }

        if (!draft.meta.label.trim()) {
          dispatch({
            type: 'MARK_STATUS',
            payload: { id: draft.id, status: 'error', error: 'Label is required' }
          });
          continue;
        }

        dispatch({ type: 'MARK_STATUS', payload: { id: draft.id, status: 'saving', error: null } });

        if (draft.isNew || !draft.serverId) {
          const created = await createAnnotation({
            image_id: imageId,
            geometry: geometryPayload(draft),
            label: draft.meta.label,
            note: draft.meta.note,
            confidence: draft.meta.confidence,
            annotator: draft.meta.annotator || annotatorRef.current || 'anonymous'
          });
          saved.push(created);
          setLastAnnotationLabel(draft.meta.label);
          dispatch({
            type: 'MARK_STATUS',
            payload: { id: draft.id, status: 'clean', error: null, serverId: created.id }
          });
        } else {
          const updated = await updateAnnotation({
            id: draft.serverId,
            geometry: geometryPayload(draft),
            label: draft.meta.label,
            note: draft.meta.note,
            confidence: draft.meta.confidence
          });
          saved.push(updated);
          setLastAnnotationLabel(draft.meta.label);
          dispatch({
            type: 'MARK_STATUS',
            payload: { id: draft.id, status: 'clean', error: null, serverId: draft.serverId }
          });
        }
      } catch (error) {
        const message =
          error instanceof AnnotationApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Failed to save annotation';
        dispatch({
          type: 'MARK_STATUS',
          payload: { id: draft.id, status: 'error', error: message }
        });
        errorCount++;
        console.error('Error saving annotation:', error);
      }
    }

    setIsSaving(false);
    if (saved.length > 0 && onSave) {
      onSave(saved);
    }
    const successMessages: string[] = [];
    if (saved.length > 0) {
      successMessages.push(`Saved ${saved.length} annotation${saved.length === 1 ? '' : 's'}`);
    }
    if (deleteCount > 0) {
      successMessages.push(`Deleted ${deleteCount} annotation${deleteCount === 1 ? '' : 's'}`);
    }
    if (successMessages.length > 0) {
      showBanner('success', successMessages.join(' · '));
    }
    if (errorCount > 0) {
      showBanner('error', `${errorCount} annotation${errorCount === 1 ? '' : 's'} need attention.`);
    }
  };

  const handleRepeatLast = () => {
    if (selectedDraft && lastAnnotationLabel) {
      dispatch({
        type: 'UPDATE_METADATA',
        payload: { id: selectedDraft.id, updates: { label: lastAnnotationLabel } }
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key.toLowerCase() === 'f' && lastAnnotationLabel) {
        e.preventDefault();
        handleRepeatLast();
      } else if (e.key === 'Escape') {
        dispatch({ type: 'SELECT', payload: null });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDraft, lastAnnotationLabel]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
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
          {selectedDraft && (
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm"
            >
              Delete Selected
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">
            {visibleDrafts.length} annotation{visibleDrafts.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleSaveAll}
            disabled={!hasPendingChanges || isSaving}
            className={`px-3 py-1 rounded text-sm font-semibold ${
              hasPendingChanges && !isSaving
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving…' : 'Save All'}
          </button>
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

      {banner && (
        <div
          className={`px-4 py-2 text-sm ${
            banner.type === 'success'
              ? 'bg-green-600/20 text-green-200'
              : 'bg-red-600/20 text-red-200'
          }`}
        >
          {banner.message}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
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

        <div className="w-72 border-l border-gray-800 bg-gray-900 overflow-y-auto">
          <AnnotationList
            annotations={annotationListItems}
            activeId={state.selectedId}
            statusById={statusMap}
            onAnnotationClick={(item) => {
              const draft = drafts.find((d) => d.id === item.id);
              if (draft) {
                dispatch({ type: 'SELECT', payload: draft.id });
              }
            }}
            onAnnotationDelete={(item) => {
              const draft = drafts.find((d) => d.id === item.id);
              if (!draft) return;
              if (!confirm('Delete this annotation?')) return;
              queueDeleteDraft(draft);
            }}
          />
        </div>
      </div>

      {selectedDraft && !selectedDraft.pendingDelete && (
        <div className="bg-gray-800 text-white p-4 border-t border-gray-700">
          <h3 className="text-sm font-semibold mb-1">
            Annotating Shape #{selectedDraft.sequence}
          </h3>
          <div className="text-xs text-gray-400 mb-3 flex items-center gap-2">
            <span>Status: {selectedDraft.status}</span>
            {selectedDraft.error && <span className="text-red-400">• {selectedDraft.error}</span>}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Label *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedDraft.meta.label}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_METADATA',
                      payload: { id: selectedDraft.id, updates: { label: e.target.value } }
                    })
                  }
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
                value={selectedDraft.meta.note}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_METADATA',
                    payload: { id: selectedDraft.id, updates: { note: e.target.value } }
                  })
                }
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
                    onClick={() =>
                      dispatch({
                        type: 'UPDATE_METADATA',
                        payload: { id: selectedDraft.id, updates: { confidence: level } }
                      })
                    }
                    className={`px-3 py-1 rounded text-sm capitalize ${
                      selectedDraft.meta.confidence === level
                        ? 'bg-green-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDraft?.pendingDelete && (
        <div className="bg-amber-500/20 text-amber-100 px-4 py-3 text-sm border-t border-amber-600">
          This annotation is queued for deletion. Click “Save All” to apply changes.
        </div>
      )}

      <div className="px-4 py-2 bg-gray-800 text-xs text-gray-400 flex gap-4 border-t border-gray-700">
        <span>Draw: Click and drag</span>
        <span>Delete: Backspace/Delete</span>
        {lastAnnotationLabel && <span>F: Repeat last label</span>}
        <span>Esc: Deselect</span>
        <span>Save All to persist changes</span>
      </div>
    </div>
  );
}

