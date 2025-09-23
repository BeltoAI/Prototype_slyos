const db = require('../_lib/db');
function getDeviceId(req) {
  return req.query.deviceId || req.headers['x-device-id'] ||
         ((typeof req.body === 'object' && req.body) ? req.body.deviceId : undefined) ||
         'unknown';
}
export default function handler(req, res) {
  const did = getDeviceId(req);
  for (const jid of Object.keys(db.jobs)) {
    if (!db.jobs[jid].done) {
      db.jobs[jid].did = did;
      return res.status(200).json({ id: jid });
    }
  }
  const jid = String(db.nextId++);
  db.jobs[jid] = { text: `demo job #${jid}`, done: false, did };
  return res.status(200).json({ id: jid });
}
