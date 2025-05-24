// api/sheet.js
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWSfFvXergearFJ7LhDM8yq45V_HLyUc7KJX2uSEFK8qGrZuKJ7_zmGQggETib3mA-/exec';

export default async function handler(req, res) {
  // re-post whatever body we got (assumes urlencoded from client)
  const params = new URLSearchParams(req.body).toString();
  const sheetsRes = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  const text = await sheetsRes.text();
  // mirror status & body
  res.status(sheetsRes.status).send(text);
}