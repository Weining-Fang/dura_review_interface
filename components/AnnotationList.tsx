import React from 'react';
import { Annotation } from '../store/useStore';

type LifecycleStatus = 'clean' | 'dirty' | 'saving' | 'error';

type AnnotationListItem = Partial<Annotation> & { id: string };

interface AnnotationListProps {
  annotations: AnnotationListItem[];
  activeId?: string | null;
  statusById?: Record<string, { status?: LifecycleStatus; pendingDelete?: boolean }>;
  onAnnotationClick?: (annotation: AnnotationListItem) => void;
  onAnnotationDelete?: (annotation: AnnotationListItem) => void;
}

const statusClasses: Record<LifecycleStatus, string> = {
  clean: 'bg-emerald-100 text-emerald-800',
  dirty: 'bg-amber-100 text-amber-800',
  saving: 'bg-sky-100 text-sky-800',
  error: 'bg-rose-100 text-rose-800'
};

export default function AnnotationList({
  annotations,
  activeId,
  statusById,
  onAnnotationClick,
  onAnnotationDelete
}: AnnotationListProps) {
  const renderStatusBadge = (id: string) => {
    const entry = statusById?.[id];
    if (!entry) return null;

    return (
      <div className="flex items-center gap-1 mt-2">
        {entry.status && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusClasses[entry.status]}`}>
            {entry.status}
          </span>
        )}
        {entry.pendingDelete && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
            delete queued
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 py-3 border-b border-gray-800">
      <h3 className="text-sm font-semibold text-gray-100 mb-3">
        Annotations ({annotations.length})
      </h3>

      {annotations.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">No annotations yet</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {annotations.map((annotation) => {
            const isActive = annotation.id === activeId;
            return (
              <div
                key={annotation.id}
                className={`p-2 rounded-lg border transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/20'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                } ${onAnnotationClick ? 'cursor-pointer' : ''}`}
                onClick={() => onAnnotationClick?.(annotation)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-100">
                      {annotation.label || 'Untitled annotation'}
                    </div>
                    {annotation.note && (
                      <div className="text-xs text-gray-400 mt-1">{annotation.note}</div>
                    )}
                  </div>

                  <div className="flex items-start gap-2">
                    {annotation.confidence && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          annotation.confidence === 'high'
                            ? 'bg-green-200/30 text-green-200'
                            : annotation.confidence === 'medium'
                            ? 'bg-yellow-200/30 text-yellow-100'
                            : 'bg-red-200/30 text-red-200'
                        }`}
                      >
                        {annotation.confidence}
                      </span>
                    )}

                    {onAnnotationDelete && (
                      <button
                        className="text-xs text-gray-400 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAnnotationDelete(annotation);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {annotation.annotator && (
                  <div className="text-[11px] text-gray-500 mt-1">
                    by {annotation.annotator}
                  </div>
                )}

                {annotation.created_at && (
                  <div className="text-[11px] text-gray-500">
                    {new Date(annotation.created_at).toLocaleDateString()}
                  </div>
                )}

                {renderStatusBadge(annotation.id)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

