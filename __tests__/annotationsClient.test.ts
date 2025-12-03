import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  listAnnotations,
  createAnnotation,
  AnnotationApiError
} from '../lib/annotations';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('annotations client', () => {
  it('normalizes list response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' } as any,
      json: async () => ({ annotations: [{ id: 'anno-1', label: 'Wall' }] })
    } as any);

    const data = await listAnnotations({ imageId: 'img-1' });
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('anno-1');
  });

  it('throws AnnotationApiError when create fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' } as any,
      json: async () => ({ error: 'boom' })
    } as any);

    await expect(
      createAnnotation({
        image_id: 'img-1',
        geometry: { type: 'rect', x: 0, y: 0, w: 0.1, h: 0.1 },
        label: 'Doorway'
      })
    ).rejects.toBeInstanceOf(AnnotationApiError);
  });
});

