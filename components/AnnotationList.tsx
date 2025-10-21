/**
 * AnnotationList Component - Display list of annotations for an image
 */

import React from 'react';
import { Annotation } from '../store/useStore';

interface AnnotationListProps {
  annotations: Annotation[];
  onAnnotationClick?: (annotation: Annotation) => void;
}

export default function AnnotationList({ annotations, onAnnotationClick }: AnnotationListProps) {
  if (annotations.length === 0) {
    return (
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Annotations</h3>
        <div className="text-sm text-gray-500 text-center py-4">
          No annotations yet
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Annotations ({annotations.length})
      </h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {annotations.map((annotation) => (
          <div
            key={annotation.id}
            className={`p-2 rounded-lg border border-gray-200 bg-gray-50 ${
              onAnnotationClick ? 'cursor-pointer hover:bg-gray-100' : ''
            }`}
            onClick={() => onAnnotationClick?.(annotation)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {annotation.label}
                </div>
                {annotation.note && (
                  <div className="text-xs text-gray-600 mt-1">
                    {annotation.note}
                  </div>
                )}
              </div>

              {annotation.confidence && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    annotation.confidence === 'high'
                      ? 'bg-green-100 text-green-800'
                      : annotation.confidence === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {annotation.confidence}
                </span>
              )}
            </div>

            {annotation.annotator && (
              <div className="text-xs text-gray-400 mt-1">
                by {annotation.annotator}
              </div>
            )}

            {annotation.created_at && (
              <div className="text-xs text-gray-400">
                {new Date(annotation.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

