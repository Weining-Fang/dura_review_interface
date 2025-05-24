// api/sheet.js
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWSfFvX…/exec';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const params = new URLSearchParams(req.body).toString();
    const sheetsRes = await fetch(SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params
    });
    const text = await sheetsRes.text();
    return res.status(sheetsRes.status).send(text);
  }
  if (req.method === 'GET') {
    const image = req.query.image || '';
    const url   = `${SCRIPT_URL}?image=${encodeURIComponent(image)}`;
    const sheetsRes = await fetch(url);
    const text = await sheetsRes.text();
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(200).json(null);
    }
  }
  res.setHeader('Allow', ['GET','POST']);
  return res.status(405).end();
}