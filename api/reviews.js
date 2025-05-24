import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    console.log('🔑 SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('🔑 SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY?.slice(0, 4) + '…');
  if (req.method === 'POST') {
    // const { image, depicts, comment, timestamp } = req.body;

    // const { data, error } = await supabase
    //   .from('reviews')
    //   .insert([{
    //     timestamp,
    //     image,
    //     comment,
    //     depicts,      // JS array → Postgres text[]
    //   }]);

    // if (error) {
    //   console.error('Insert error:', error);
    //   return res.status(500).json({ status: 'error', message: error.message, details: error.details});
    // }
    // return res.status(200).json({ status: 'ok', data });
    try {
        const { image, depicts, comment, timestamp } = req.body;
        const { data, error } = await supabase
          .from('reviews')
          .insert([{ timestamp, image, comment, depicts }]);
        
        if (error) {
          // throw a real Error whose message is the full JSON of the supabase error
          throw new Error(JSON.stringify(error, null, 2));
        }
  
        return res.status(200).json({ status: 'ok', data });
      } catch (e) {
        // e.message now contains the full JSON from supabase
        console.error('❌ Insert exception:', e);
        return res
          .status(500)
          .json({ status: 'error', message: e.message });
      }
  }

  if (req.method === 'GET') {
    const { image } = req.query;   // grabs ?image=filename.jpg
    let query = supabase.from('reviews').select('*').order('id', { ascending:true });
    if (image) {
      query = query.eq('image', image);
    }
  
    const { data, error } = await query;
    if (error) {
      console.error('Select error:', error);
      return res.status(500).json({ status: 'error', error });
    }
    // return an array (0 or 1 elements) of reviews for that image
    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}