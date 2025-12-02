/**
 * GallerySidebar - Tag and metadata filters for gallery view
 */

import React, { useMemo } from 'react';
import { Image } from '../../store/useStore';
import { useTagFilterState } from '../../store/hooks';

interface GallerySidebarProps {
  images: Image[];
}

export default function GallerySidebar({ images }: GallerySidebarProps) {
  const { tagFilters, setTagFilters } = useTagFilterState();

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    images.forEach((img) => {
      (img.tags || img.keywords || []).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [images]);

  const uniqueSeasons = useMemo(() => {
    return Array.from(new Set(images.map((img) => img.season).filter(Boolean) as string[])).sort();
  }, [images]);

  const uniqueDepict = useMemo(() => {
    return Array.from(new Set(images.map((img) => img.depict_l1).filter(Boolean) as string[])).sort();
  }, [images]);

  const uniquePhotographers = useMemo(() => {
    return Array.from(
      new Set(images.map((img) => img.photographer).filter(Boolean) as string[])
    ).sort();
  }, [images]);

  const toggleTag = (tag: string) => {
    const exists = tagFilters.imageTags.includes(tag);
    setTagFilters({
      imageTags: exists
        ? tagFilters.imageTags.filter((t) => t !== tag)
        : [...tagFilters.imageTags, tag],
    });
  };

  const toggleMetadata = (field: 'seasons' | 'depict' | 'photographer', value: string) => {
    const current = tagFilters.metadata[field];
    const exists = current.includes(value);
    setTagFilters({
      metadata: {
        ...tagFilters.metadata,
        [field]: exists ? current.filter((v) => v !== value) : [...current, value],
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <section className="border-b border-gray-200 p-4">
        <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-widest mb-2">
          Tags
        </h3>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
          {uniqueTags.length === 0 && (
            <p className="text-xs text-gray-500">No tags available for this selection.</p>
          )}
          {uniqueTags.map((tag) => {
            const active = tagFilters.imageTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-b border-gray-200 p-4">
        <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-widest mb-2">
          Seasons
        </h3>
        <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
          {uniqueSeasons.map((season) => {
            const active = tagFilters.metadata.seasons.includes(season);
            return (
              <label key={season} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleMetadata('seasons', season)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {season}
              </label>
            );
          })}
        </div>
      </section>

      <section className="border-b border-gray-200 p-4">
        <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-widest mb-2">
          Depictions
        </h3>
        <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
          {uniqueDepict.map((depict) => {
            const active = tagFilters.metadata.depict.includes(depict);
            return (
              <label key={depict} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleMetadata('depict', depict)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {depict}
              </label>
            );
          })}
        </div>
      </section>

      <section className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-widest mb-2">
          Photographers
        </h3>
        <div className="space-y-1">
          {uniquePhotographers.map((photographer) => {
            const active = tagFilters.metadata.photographer.includes(photographer);
            return (
              <label key={photographer} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleMetadata('photographer', photographer)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {photographer}
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
