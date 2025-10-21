/**
 * MetadataCard Component - Display image metadata
 */

import React from 'react';
import { Image } from '../store/useStore';

interface MetadataCardProps {
  image: Image | null;
}

export default function MetadataCard({ image }: MetadataCardProps) {
  if (!image) {
    return (
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="text-sm text-gray-500 text-center">
          Select an image to view metadata
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Image Details</h3>

      <dl className="space-y-2">
        {image.description && (
          <div>
            <dt className="text-xs text-gray-500">Description</dt>
            <dd className="text-sm text-gray-900 mt-0.5">{image.description}</dd>
          </div>
        )}

        <div>
          <dt className="text-xs text-gray-500">Filename</dt>
          <dd className="text-sm text-gray-900 mt-0.5 break-words">{image.filename}</dd>
        </div>

        {image.site_id && (
          <div>
            <dt className="text-xs text-gray-500">Site</dt>
            <dd className="text-sm text-gray-900 mt-0.5">{image.site_id.toUpperCase()}</dd>
          </div>
        )}

        {image.season && (
          <div>
            <dt className="text-xs text-gray-500">Excavation Season</dt>
            <dd className="text-sm text-gray-900 mt-0.5">{image.season}</dd>
          </div>
        )}

        {image.photographer && (
          <div>
            <dt className="text-xs text-gray-500">Photographer</dt>
            <dd className="text-sm text-gray-900 mt-0.5">{image.photographer}</dd>
          </div>
        )}

        {image.depict_l1 && (
          <div>
            <dt className="text-xs text-gray-500">Category</dt>
            <dd className="text-sm text-gray-900 mt-0.5 capitalize">{image.depict_l1}</dd>
          </div>
        )}

        {image.depict_l2 && (
          <div>
            <dt className="text-xs text-gray-500">Depicts</dt>
            <dd className="text-sm text-gray-900 mt-0.5">{image.depict_l2}</dd>
          </div>
        )}

        {image.keywords && image.keywords.length > 0 && (
          <div>
            <dt className="text-xs text-gray-500 mb-1">Keywords</dt>
            <dd className="flex flex-wrap gap-1">
              {image.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {keyword}
                </span>
              ))}
            </dd>
          </div>
        )}

        {image.annotation_count !== undefined && (
          <div>
            <dt className="text-xs text-gray-500">Annotations</dt>
            <dd className="text-sm text-gray-900 mt-0.5">
              {image.annotation_count} annotation{image.annotation_count !== 1 ? 's' : ''}
            </dd>
          </div>
        )}
      </dl>

      {/* Link to source */}
      {image.url && (
        <div className="mt-4">
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            View on Wikimedia Commons →
          </a>
        </div>
      )}
    </div>
  );
}

