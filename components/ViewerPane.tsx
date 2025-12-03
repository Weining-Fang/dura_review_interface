import React, { ReactNode } from 'react';
import { Image } from '../store/useStore';
import AnnotoriousViewer from './AnnotoriousViewer';

interface ViewerPaneProps {
  image: Image;
  annotationsCount: number;
  showAnnotations: boolean;
  onBack: () => void;
  onToggleAnnotations: () => void;
  onOpenEditor: () => void;
  overlay?: ReactNode;
  toolbarExtras?: ReactNode;
  annotationToggleDisabled?: boolean;
  editDisabled?: boolean;
  backLabel?: string;
  annotations?: any[];
}

export default function ViewerPane({
  image,
  annotationsCount,
  showAnnotations,
  onBack,
  onToggleAnnotations,
  onOpenEditor,
  overlay,
  toolbarExtras,
  annotationToggleDisabled,
  editDisabled,
  backLabel,
  annotations = []
}: ViewerPaneProps) {
  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
        <div className="flex items-center gap-4 overflow-hidden">
          <button
            onClick={onBack}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex-shrink-0"
          >
            {backLabel || '← Back to Gallery'}
          </button>
          <div className="text-sm text-gray-300 truncate">
            {image.description || image.filename}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenEditor}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={editDisabled}
          >
            ✏️ Edit Annotations
          </button>

          <button
            onClick={onToggleAnnotations}
            className={`px-3 py-1 rounded text-sm ${
              showAnnotations ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={annotationToggleDisabled}
          >
            Annotations ({annotationsCount})
          </button>

          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Download
          </a>

          {toolbarExtras}
        </div>
      </div>

      <div className="flex-1 bg-black">
        <AnnotoriousViewer
          imageUrl={image.url}
          annotations={annotations}
          showAnnotations={showAnnotations}
          readOnly={true}
        />
      </div>

      <div className="px-4 py-2 bg-gray-800 text-xs text-gray-400 flex gap-4">
        <span>Esc: Back to gallery</span>
        <span>Scroll/Pinch: Zoom & pan</span>
        <span>Double-click: Zoom in</span>
      </div>
    </div>
  );
}

