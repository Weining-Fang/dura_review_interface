// api/sheet.js
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWSfFvXergearFJ7LhDM8yq45V_HLyUc7KJX2uSEFK8qGrZuKJ7_zmGQggETib3mA-/exec';

export default async function handler(req, res) {
    if (req.method === 'POST') {
      // proxy the form‐encoded POST
      const params = new URLSearchParams(req.body).toString();
      const sheetsRes = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      const text = await sheetsRes.text();
      return res.status(sheetsRes.status).send(text);
    }
    else if (req.method === 'GET') {
      // proxy the GET with image query
      const image = req.query.image || '';
      const url   = `${SCRIPT_URL}?image=${encodeURIComponent(image)}`;
      const sheetsRes = await fetch(url);
      const text = await sheetsRes.text();
      // try to parse JSON, otherwise return null
      let json;
      try { json = JSON.parse(text); } catch { json = null; }
      return res.status(200).json(json);
    }
    else {
      res.setHeader('Allow', ['GET','POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }