export type ShapeType = 'rect' | 'ellipse';

export interface RectGeom {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EllipseGeom {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface NormalizedShape {
  id: string;
  type: ShapeType;
  geom: RectGeom | EllipseGeom;
  label: number;
}

export type GeometryPayload =
  | ({ type: 'rect'; label?: number } & RectGeom)
  | ({ type: 'ellipse'; label?: number } & EllipseGeom);

export interface DragPoint {
  x: number;
  y: number;
}

const MIN_SIZE = 0.005;

export function deserializeGeometry(
  geometry: any,
  fallbackId: string,
  fallbackLabel: number
): NormalizedShape {
  const parsed = typeof geometry === 'string' ? safeParseGeometry(geometry) : geometry;
  const type: ShapeType = parsed?.type === 'ellipse' ? 'ellipse' : 'rect';

  const geom =
    type === 'rect'
      ? {
          x: parsed?.x ?? 0,
          y: parsed?.y ?? 0,
          w: parsed?.w ?? 0,
          h: parsed?.h ?? 0
        }
      : {
          cx: parsed?.cx ?? 0.5,
          cy: parsed?.cy ?? 0.5,
          rx: parsed?.rx ?? 0.1,
          ry: parsed?.ry ?? 0.1
        };

  return {
    id: parsed?.id || fallbackId,
    type,
    geom,
    label: parsed?.label ?? fallbackLabel
  };
}

export function serializeShapeGeometry(shape: NormalizedShape): GeometryPayload {
  if (shape.type === 'rect') {
    return {
      type: 'rect',
      ...(shape.geom as RectGeom),
      label: shape.label
    };
  }

  return {
    type: 'ellipse',
    ...(shape.geom as EllipseGeom),
    label: shape.label
  };
}

export function createRectFromPoints(
  start: DragPoint,
  current: DragPoint,
  enforceMin = true
): RectGeom | null {
  const x1 = Math.min(start.x, current.x);
  const y1 = Math.min(start.y, current.y);
  const w = Math.abs(current.x - start.x);
  const h = Math.abs(current.y - start.y);

  if (enforceMin && (w < MIN_SIZE || h < MIN_SIZE)) {
    return null;
  }

  return { x: x1, y: y1, w, h };
}

export function createEllipseFromPoints(
  start: DragPoint,
  current: DragPoint,
  enforceMin = true
): EllipseGeom | null {
  const cx = (start.x + current.x) / 2;
  const cy = (start.y + current.y) / 2;
  const rx = Math.abs(current.x - start.x) / 2;
  const ry = Math.abs(current.y - start.y) / 2;

  if (enforceMin && (rx < MIN_SIZE || ry < MIN_SIZE)) {
    return null;
  }

  return { cx, cy, rx, ry };
}

function safeParseGeometry(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

