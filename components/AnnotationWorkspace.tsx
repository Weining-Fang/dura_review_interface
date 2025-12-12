import React, { useCallback, useEffect, useState } from 'react';
import { Image } from '../store/useStore';
import ViewerPane from './ViewerPane';
import AnnotationEditor from './AnnotationEditor';
import MetadataCard from './MetadataCard';
import AnnotationList from './AnnotationList';
import { useImageAnnotations } from '../hooks/useImageAnnotations';

interface AnnotationWorkspaceProps {
  imageId: string;
  image: Image | null;
  onExit: () => void;
  exitLabel?: string;
  className?: string;
}

export default function AnnotationWorkspace({
  imageId,
  image,
  onExit,
  exitLabel,
  className = ''
}: AnnotationWorkspaceProps) {
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  const {
    annotations,
    isLoading: annotationsLoading,
    error: annotationsError,
    refresh: refreshAnnotations
  } = useImageAnnotations(imageId);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (showEditor) {
        setShowEditor(false);
        return;
      }
      onExit();
    },
    [onExit, showEditor]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  useEffect(() => {
    setShowEditor(false);
  }, [imageId]);

  const handleAnnotationSave = async () => {
    await refreshAnnotations();
    setShowEditor(false);
  };

  if (!image) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className}`}>
        <div className="text-center space-y-2">
          <div className="text-gray-600 font-medium">Image unavailable</div>
          <button
            onClick={onExit}
            className="px-4 py-2 text-sm rounded bg-gray-900 text-white hover:bg-gray-800"
          >
            Close workspace
          </button>
        </div>
      </div>
    );
  }

  const sidePanel = (
    <aside className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      <MetadataCard image={image} />

      <div className="flex-1 overflow-y-auto">
        {annotationsLoading && (
          <div className="px-4 py-3 text-sm text-gray-500">Loading annotations…</div>
        )}

        {annotationsError && (
          <div className="px-4 py-3 text-sm text-red-600">Failed to load annotations.</div>
        )}

        {showAnnotations ? (
          <AnnotationList annotations={annotations} />
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-500 border-b border-gray-200">
            Annotations hidden
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 space-y-2">
        <button
          onClick={() => refreshAnnotations()}
          className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium disabled:opacity-50"
          disabled={annotationsLoading}
        >
          Refresh annotations
        </button>
        <button
          onClick={() => setShowEditor(true)}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50"
          disabled={annotationsLoading}
        >
          New annotation
        </button>
      </div>
    </aside>
  );

  return (
    <div className={`flex h-full bg-gray-900 ${className}`}>
      <div className="flex-1 min-w-0">
        {showEditor ? (
          <AnnotationEditor
            imageUrl={image.url}
            imageId={imageId}
            existingAnnotations={annotations}
            onSave={handleAnnotationSave}
            onClose={() => setShowEditor(false)}
          />
        ) : (
          <ViewerPane
            image={image}
            annotationsCount={annotations.length}
            showAnnotations={showAnnotations}
            onBack={onExit}
            onToggleAnnotations={() => setShowAnnotations((prev) => !prev)}
            onOpenEditor={() => setShowEditor(true)}
            annotationToggleDisabled={annotationsLoading}
            editDisabled={annotationsLoading}
            backLabel={exitLabel}
            annotations={annotations}
          />
        )}
      </div>
      {sidePanel}
    </div>
  );
}


