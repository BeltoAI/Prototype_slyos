const db = require('../_lib/db');
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const body = (typeof req.body === 'object' && req.body) ? req.body : {};
  const headerId = req.headers['x-device-id'];
  const id = body.deviceId || headerId || `debug-${Math.floor(Math.random()*1e8).toString().padStart(8,'0')}`;
  if (!db.perDevice[id]) db.perDevice[id] = 0;
  return res.status(200).json({ id });
}
