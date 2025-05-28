// api/sheet.js
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWSfFvXergearFJ7LhDM8yq45V_HLyUc7KJX2uSEFK8qGrZuKJ7_zmGQggETib3mA-/exec';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // console.log('[API] Received POST request');
    // console.log('[API] Parsed body:', req.body);
    
    const form = new URLSearchParams();
    form.append('timestamp', req.body.timestamp);
    form.append('image', req.body.image);
    form.append('depicts', req.body.depicts);
    form.append('comment', req.body.comment);
    
    const sheetsRes = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    
    const text = await sheetsRes.text();
    return res.status(sheetsRes.status).send(text);
  }

  if (req.method === 'GET') {
    const image = req.query.image || '';
    const url   = `${SCRIPT_URL}?image=${encodeURIComponent(image)}`;
    console.log('→ Proxying GET to', url);
    
    const sheetsRes = await fetch(url);
    const text      = await sheetsRes.text();
    console.log('← Script returned:', text);

    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.warn('Could not JSON.parse text, returning null');
    }
    return res.status(200).json(json);
  }

  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}