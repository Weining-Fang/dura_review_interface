export default function handler(req, res) {
    if (req.method === 'POST') {
      // Here we just echo back and log on the server
      console.log('New review:', req.body);
      return res.status(200).json({ status: 'ok' });
    }
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }