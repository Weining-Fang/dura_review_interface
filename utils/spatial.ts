/**
 * Spatial utility functions
 */

/**
 * Calculate distance between two points in meters
 * Using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate centroid of a polygon
 */
export function calculateCentroid(coordinates: number[][][]): [number, number] {
  if (!coordinates || coordinates.length === 0 || coordinates[0].length === 0) {
    return [0, 0];
  }

  const ring = coordinates[0]; // Outer ring
  let sumLon = 0;
  let sumLat = 0;
  let count = ring.length - 1; // Don't count the duplicate last point

  for (let i = 0; i < count; i++) {
    sumLon += ring[i][0];
    sumLat += ring[i][1];
  }

  return [sumLon / count, sumLat / count];
}

/**
 * Check if a point is inside a polygon
 * Using ray casting algorithm
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: number[][][]
): boolean {
  const [x, y] = point;
  const ring = polygon[0]; // Outer ring
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate bounding box of a polygon
 */
export function calculateBoundingBox(coordinates: number[][][]): {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
} {
  if (!coordinates || coordinates.length === 0 || coordinates[0].length === 0) {
    return { minLon: 0, minLat: 0, maxLon: 0, maxLat: 0 };
  }

  const ring = coordinates[0];
  let minLon = ring[0][0];
  let maxLon = ring[0][0];
  let minLat = ring[0][1];
  let maxLat = ring[0][1];

  for (const point of ring) {
    if (point[0] < minLon) minLon = point[0];
    if (point[0] > maxLon) maxLon = point[0];
    if (point[1] < minLat) minLat = point[1];
    if (point[1] > maxLat) maxLat = point[1];
  }

  return { minLon, minLat, maxLon, maxLat };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

/**
 * Convert GeoJSON geometry to WKT format (for PostGIS)
 */
export function geojsonToWKT(geometry: any): string {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    return '';
  }

  const coords = geometry.coordinates;

  switch (geometry.type) {
    case 'Point':
      return `POINT(${coords[0]} ${coords[1]})`;

    case 'LineString':
      return `LINESTRING(${coords.map((c: number[]) => `${c[0]} ${c[1]}`).join(',')})`;

    case 'Polygon':
      const rings = coords.map((ring: number[][]) =>
        `(${ring.map((c: number[]) => `${c[0]} ${c[1]}`).join(',')})`
      );
      return `POLYGON(${rings.join(',')})`;

    case 'MultiPolygon':
      const polygons = coords.map((polygon: number[][][]) => {
        const rings = polygon.map((ring: number[][]) =>
          `(${ring.map((c: number[]) => `${c[0]} ${c[1]}`).join(',')})`
        );
        return `(${rings.join(',')})`;
      });
      return `MULTIPOLYGON(${polygons.join(',')})`;

    default:
      return '';
  }
}

