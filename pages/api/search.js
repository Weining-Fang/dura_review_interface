/**
 * GET /api/search - Faceted search across sites and images
 * Query params:
 *   - q: full-text search query
 *   - building_type[]: array of building types
 *   - period[]: array of periods
 *   - season: specific season
 *   - has_annotations: boolean
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

  try {
    const { q, building_type, period, season, has_annotations } = req.query;

    // Parse array parameters
    const buildingTypes = Array.isArray(building_type) ? building_type : (building_type ? [building_type] : []);
    const periods = Array.isArray(period) ? period : (period ? [period] : []);

    // Build sites query
    let sitesQuery = supabase.from('sites').select('*');

    if (buildingTypes.length > 0) {
      sitesQuery = sitesQuery.in('building_type', buildingTypes);
    }

    if (periods.length > 0) {
      sitesQuery = sitesQuery.overlaps('period', periods);
    }

    // Build images query
    let imagesQuery = supabase
      .from('images')
      .select(`
        *,
        annotations:annotations(count)
      `);

    // Full-text search on images
    if (q && q.trim()) {
      imagesQuery = imagesQuery.or(`description.ilike.%${q}%,filename.ilike.%${q}%,depict_l2.ilike.%${q}%`);
    }

    if (season) {
      imagesQuery = imagesQuery.eq('season', season);
    }

    // Execute queries in parallel
    const [sitesResult, imagesResult] = await Promise.all([
      sitesQuery,
      imagesQuery
    ]);

    if (sitesResult.error) {
      console.error('Error searching sites:', sitesResult.error);
      return res.status(500).json({ error: sitesResult.error.message });
    }

    if (imagesResult.error) {
      console.error('Error searching images:', imagesResult.error);
      return res.status(500).json({ error: imagesResult.error.message });
    }

    let sites = sitesResult.data || [];
    let images = (imagesResult.data || []).map(img => ({
      ...img,
      annotation_count: img.annotations?.[0]?.count || 0,
      annotations: undefined
    }));

    // Filter by has_annotations
    if (has_annotations === 'true') {
      images = images.filter(img => img.annotation_count > 0);
    }

    // Filter sites to only those with matching images
    const imagesBySite = new Map();
    images.forEach(img => {
      if (!imagesBySite.has(img.site_id)) {
        imagesBySite.set(img.site_id, []);
      }
      imagesBySite.get(img.site_id).push(img);
    });

    sites = sites.filter(site => imagesBySite.has(site.id));

    // Calculate facet counts
    const facetCounts = {
      building_types: {},
      periods: {},
      seasons: {},
      total_sites: sites.length,
      total_images: images.length
    };

    sites.forEach(site => {
      if (site.building_type) {
        facetCounts.building_types[site.building_type] = 
          (facetCounts.building_types[site.building_type] || 0) + 1;
      }
      if (site.period) {
        site.period.forEach(p => {
          facetCounts.periods[p] = (facetCounts.periods[p] || 0) + 1;
        });
      }
    });

    images.forEach(img => {
      if (img.season) {
        facetCounts.seasons[img.season] = 
          (facetCounts.seasons[img.season] || 0) + 1;
      }
    });

    return res.status(200).json({
      sites,
      images,
      facetCounts
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

