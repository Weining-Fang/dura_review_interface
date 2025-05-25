// api/sheet.js
import fetch from 'node-fetch';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWSfFvXergearFJ7LhDM8yq45V_HLyUc7KJX2uSEFK8qGrZuKJ7_zmGQggETib3mA-/exec';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 🚨 Buffer the raw POST body
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
    }
    // Forward it verbatim to the Apps Script
    const sheetsRes = await fetch(SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': req.headers['content-type'] },
      body:    raw
    });
    const text = await sheetsRes.text();
    return res.status(sheetsRes.status).send(text);
  }

  if (req.method === 'GET') {
    // Proxy the GET with image query param
    const image = req.query.image || '';
    const url   = `${SCRIPT_URL}?image=${encodeURIComponent(image)}`;
    const sheetsRes = await fetch(url);
    const text = await sheetsRes.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // if the script returned nothing, json stays null
    }
    return res.status(200).json(json);
  }

  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}