/**
 * GET /api/images/[id] - Get a single image with optional annotations
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

  const { id } = req.query;

  try {
    // Fetch image
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .single();

    if (imageError) {
      if (imageError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Image not found' });
      }
      console.error('Error fetching image:', imageError);
      return res.status(500).json({ error: imageError.message });
    }

    // Fetch annotations for this image
    const { data: annotations, error: annotError } = await supabase
      .from('annotations')
      .select('*')
      .eq('image_id', id)
      .order('created_at', { ascending: false });

    if (annotError) {
      console.error('Error fetching annotations:', annotError);
      // Don't fail the request if annotations fail
    }

    return res.status(200).json({
      image,
      annotations: annotations || []
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

