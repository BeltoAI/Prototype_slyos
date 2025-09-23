const db = require('../../_lib/db');
export default function handler(req, res) {
  const { id } = req.query;
  res.status(200).json({ credits: db.perDevice[id] || 0 });
}
