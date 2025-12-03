import { useCallback, useEffect, useState } from 'react';
import { Annotation, useStore } from '../store/useStore';

interface UseImageAnnotationsResult {
  annotations: Annotation[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useImageAnnotations(imageId: string | null | undefined): UseImageAnnotationsResult {
  const { setAnnotations } = useStore();
  const [annotations, setLocalAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!imageId) {
      setLocalAnnotations([]);
      setAnnotations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/annotations?image_id=${imageId}`);
      if (!response.ok) {
        throw new Error('Failed to load annotations');
      }

      const data = await response.json();
      const nextAnnotations: Annotation[] = data?.annotations ?? [];
      setLocalAnnotations(nextAnnotations);
      setAnnotations(nextAnnotations);
    } catch (err) {
      console.error('Error loading annotations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [imageId, setAnnotations]);

  useEffect(() => {
    if (!imageId) {
      setLocalAnnotations([]);
      setError(null);
      return;
    }

    refresh();
  }, [imageId, refresh]);

  return {
    annotations,
    isLoading,
    error,
    refresh
  };
}

