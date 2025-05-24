import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { image, depicts, comment, timestamp } = req.body;

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        timestamp,
        image,
        comment,
        depicts,      // JS array → Postgres text[]
      }]);

    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ status: 'error', error });
    }
    return res.status(200).json({ status: 'ok', data });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Select error:', error);
      return res.status(500).json({ status: 'error', error });
    }
    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}