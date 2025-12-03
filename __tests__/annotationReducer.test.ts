import { describe, it, expect } from 'vitest';
import {
  annotationReducer,
  initialEditorState,
  AnnotationDraft
} from '../components/AnnotationEditor';

const makeDraft = (overrides: Partial<AnnotationDraft> = {}): AnnotationDraft => ({
  id: 'draft-1',
  type: 'rect',
  geom: { x: 0, y: 0, w: 0.1, h: 0.1 },
  meta: { label: 'Wall', note: '', confidence: 'medium', annotator: 'tester' },
  status: 'dirty',
  isNew: true,
  pendingDelete: false,
  error: null,
  sequence: 1,
  ...overrides
});

describe('annotationReducer', () => {
  it('adds drafts and selects them', () => {
    const draft = makeDraft();
    const state = annotationReducer(initialEditorState, { type: 'ADD_DRAFT', payload: draft });
    expect(state.drafts).toHaveLength(1);
    expect(state.selectedId).toBe(draft.id);
    expect(state.nextSequence).toBeGreaterThan(1);
  });

  it('marks drafts as pending delete', () => {
    const loaded = {
      ...initialEditorState,
      drafts: [makeDraft({ id: 'd-1', serverId: 'srv-1', status: 'clean', isNew: false })],
      selectedId: 'd-1'
    };
    const state = annotationReducer(loaded, { type: 'MARK_PENDING_DELETE', payload: { id: 'd-1' } });
    expect(state.drafts[0].pendingDelete).toBe(true);
    expect(state.selectedId).toBeNull();
  });

  it('clears pending delete when saved clean', () => {
    const draft = makeDraft({ id: 'd-2', pendingDelete: true, serverId: 'srv-2' });
    const loaded = { ...initialEditorState, drafts: [draft], selectedId: 'd-2' };
    const state = annotationReducer(loaded, {
      type: 'MARK_STATUS',
      payload: { id: 'd-2', status: 'clean', serverId: 'srv-2' }
    });
    expect(state.drafts[0].pendingDelete).toBe(false);
    expect(state.drafts[0].status).toBe('clean');
  });
});

