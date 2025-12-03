import { useCallback, useEffect } from 'react';
import { useStore, Annotation } from '../store/useStore';
import { listAnnotations, AnnotationApiError } from '../lib/annotations';

interface UseAnnotationsOptions {
  skip?: boolean;
  refreshOnMount?: boolean;
}

interface UseAnnotationsReturn {
  annotations: Annotation[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  refresh: (force?: boolean) => Promise<void>;
}

export function useAnnotations(
  imageId?: string | null,
  options: UseAnnotationsOptions = {}
): UseAnnotationsReturn {
  const { skip = false, refreshOnMount = false } = options;

  const annotationsByImage = useStore((state) => state.annotationsByImage);
  const annotationStatus = useStore((state) => state.annotationStatus);
  const setAnnotationsForImage = useStore((state) => state.setAnnotationsForImage);
  const setAnnotationStatus = useStore((state) => state.setAnnotationStatus);

  const cachedAnnotations = imageId ? annotationsByImage[imageId] : undefined;
  const currentStatus = imageId ? annotationStatus[imageId] : undefined;

  const fetchAnnotations = useCallback(
    async (force?: boolean) => {
      if (!imageId || skip) return;
      if (!force && currentStatus?.loading) return;

      setAnnotationStatus(imageId, {
        loading: true,
        error: null,
        lastFetched: currentStatus?.lastFetched ?? null
      });

      try {
        const nextAnnotations = await listAnnotations({ imageId });
        setAnnotationsForImage(imageId, nextAnnotations);
        setAnnotationStatus(imageId, {
          loading: false,
          error: null,
          lastFetched: Date.now()
        });
      } catch (error: any) {
        const message =
          error instanceof AnnotationApiError
            ? error.message
            : error?.message || 'Failed to load annotations';
        setAnnotationStatus(imageId, {
          loading: false,
          error: message,
          lastFetched: currentStatus?.lastFetched ?? null
        });
        throw error;
      }
    },
    [
      imageId,
      skip,
      currentStatus?.loading,
      currentStatus?.lastFetched,
      setAnnotationStatus,
      setAnnotationsForImage
    ]
  );

  useEffect(() => {
    if (!imageId || skip) return;
    const hasCached = Array.isArray(cachedAnnotations) && cachedAnnotations.length > 0;
    if (hasCached && !refreshOnMount) return;
    if (currentStatus?.loading) return;
    fetchAnnotations().catch(() => undefined);
  }, [
    imageId,
    skip,
    refreshOnMount,
    cachedAnnotations,
    currentStatus?.loading,
    fetchAnnotations
  ]);

  return {
    annotations: cachedAnnotations || [],
    loading: currentStatus?.loading ?? false,
    error: currentStatus?.error ?? null,
    lastFetched: currentStatus?.lastFetched ?? null,
    refresh: (force = true) => fetchAnnotations(force)
  };
}

