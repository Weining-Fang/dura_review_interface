/**
 * GET /api/sites/[id]/nearby - Get nearby sites using PostGIS spatial query
 * Query params:
 *   - limit: number of nearby sites to return (default: 5)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!supabase) {
    console.error('Supabase client not initialized');
    return res.status(500).json({ 
      error: 'Database not configured',
      message: 'Missing Supabase environment variables'
    });
  }

  const { id } = req.query;
  const limit = parseInt(req.query.limit || '5', 10);

  try {
    // Call the nearby_sites function
    const { data, error } = await supabase
      .rpc('nearby_sites', {
        target_id: id,
        limit_n: limit
      });

    if (error) {
      console.error('Error fetching nearby sites:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ nearby_sites: data || [] });
  } catch (error) {
    console.error('Error fetching nearby sites:', {
      message: error.message,
      details: error.toString(),
      stack: error.stack
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
}

