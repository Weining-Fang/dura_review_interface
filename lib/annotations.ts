import { Annotation } from '../store/useStore';

export class AnnotationApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'AnnotationApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);

  let payload: any = null;
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = payload?.error || response.statusText || 'Annotation API error';
    throw new AnnotationApiError(message, response.status, payload);
  }

  return (payload ?? {}) as T;
}

export async function listAnnotations(params: {
  imageId: string;
  signal?: AbortSignal;
}): Promise<Annotation[]> {
  const { imageId, signal } = params;
  const query = new URLSearchParams({ image_id: imageId });
  const data = await request<{ annotations?: Annotation[] }>(`/api/annotations?${query.toString()}`, {
    method: 'GET',
    signal
  });
  return Array.isArray(data.annotations) ? data.annotations : [];
}

export interface AnnotationCreateInput {
  image_id: string;
  geometry: any;
  label: string;
  note?: string;
  confidence?: 'low' | 'medium' | 'high';
  annotator?: string;
}

export async function createAnnotation(payload: AnnotationCreateInput): Promise<Annotation> {
  const data = await request<{ annotation: Annotation }>('/api/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!data.annotation) {
    throw new AnnotationApiError('Invalid response from annotation API', 500, data);
  }
  return data.annotation;
}

export interface AnnotationUpdateInput {
  id: string;
  geometry?: any;
  label?: string;
  note?: string;
  confidence?: 'low' | 'medium' | 'high';
}

export async function updateAnnotation(payload: AnnotationUpdateInput): Promise<Annotation> {
  const data = await request<{ annotation: Annotation }>('/api/annotations', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!data.annotation) {
    throw new AnnotationApiError('Invalid response from annotation API', 500, data);
  }
  return data.annotation;
}

export async function deleteAnnotation(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/annotations?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

