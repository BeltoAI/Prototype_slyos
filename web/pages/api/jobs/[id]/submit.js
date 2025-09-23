const db = require('../../_lib/db');
function getDeviceId(req) {
  return req.query.deviceId || req.headers['x-device-id'] ||
         ((typeof req.body === 'object' && req.body) ? req.body.deviceId : undefined) ||
         'unknown';
}
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const { id } = req.query;
  const did = getDeviceId(req);
  if (!db.jobs[id]) db.jobs[id] = { text: "", done: false };
  const body = (typeof req.body === 'object' && req.body) ? req.body : {};
  db.jobs[id].done = true;
  db.perDevice[did] = (db.perDevice[did] || 0) + 1;
  db.total += 1;
  res.status(200).json({ ok: true });
}
