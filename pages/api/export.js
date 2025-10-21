/**
 * Export API - Generate exports in various formats
 * GET /api/export?format=csv|geojson|iiif
 * Query params:
 *   - format: csv (annotations), geojson (sites), or iiif (manifests bundle info)
 *   - site_id: optional site filter
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { format, site_id } = req.query;

  try {
    if (format === 'csv') {
      return await exportCSV(req, res, site_id);
    } else if (format === 'geojson') {
      return await exportGeoJSON(req, res, site_id);
    } else if (format === 'iiif') {
      return await exportIIIF(req, res, site_id);
    } else {
      return res.status(400).json({ error: 'Invalid format. Use csv, geojson, or iiif' });
    }
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function exportCSV(req, res, siteId) {
  // Fetch annotations with related data
  let query = supabase
    .from('annotations')
    .select(`
      id,
      label,
      note,
      confidence,
      annotator,
      created_at,
      images!inner(
        id,
        filename,
        site_id,
        season,
        description
      )
    `)
    .order('created_at', { ascending: false });

  if (siteId) {
    query = query.eq('images.site_id', siteId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching annotations for export:', error);
    return res.status(500).json({ error: error.message });
  }

  // Convert to CSV
  const rows = [
    ['Annotation ID', 'Image ID', 'Filename', 'Site', 'Season', 'Label', 'Note', 'Confidence', 'Annotator', 'Created At']
  ];

  (data || []).forEach(annot => {
    const img = annot.images;
    rows.push([
      annot.id,
      img.id,
      img.filename,
      img.site_id,
      img.season || '',
      annot.label,
      annot.note || '',
      annot.confidence || '',
      annot.annotator || '',
      annot.created_at
    ]);
  });

  const csv = rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="annotations-export-${Date.now()}.csv"`);
  return res.status(200).send(csv);
}

async function exportGeoJSON(req, res, siteId) {
  // Fetch sites with geometries and annotation counts
  let query = supabase
    .from('sites')
    .select(`
      *,
      images(count),
      annotations:images!inner(annotations(count))
    `);

  if (siteId) {
    query = query.eq('id', siteId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sites for export:', error);
    return res.status(500).json({ error: error.message });
  }

  // Convert to GeoJSON
  const features = (data || [])
    .filter(site => site.geometry)
    .map(site => ({
      type: 'Feature',
      id: site.id,
      geometry: site.geometry,
      properties: {
        id: site.id,
        name: site.name,
        building_type: site.building_type,
        period: site.period,
        image_count: site.images?.[0]?.count || 0,
        annotation_count: site.annotations?.[0]?.count || 0,
        excavation_seasons: site.excavation_seasons,
        notes: site.notes
      }
    }));

  const geojson = {
    type: 'FeatureCollection',
    features
  };

  res.setHeader('Content-Type', 'application/geo+json');
  res.setHeader('Content-Disposition', `attachment; filename="sites-export-${Date.now()}.geojson"`);
  return res.status(200).json(geojson);
}

async function exportIIIF(req, res, siteId) {
  // Return list of IIIF manifest URLs
  let query = supabase.from('images').select('id, filename, site_id, description');

  if (siteId) {
    query = query.eq('site_id', siteId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching images for IIIF export:', error);
    return res.status(500).json({ error: error.message });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const manifests = (data || []).map(img => ({
    image_id: img.id,
    filename: img.filename,
    site_id: img.site_id,
    description: img.description,
    manifest_url: `${baseUrl}/api/iiif/${img.id}/manifest.json`
  }));

  return res.status(200).json({
    total: manifests.length,
    manifests
  });
}

