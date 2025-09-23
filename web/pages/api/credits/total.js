const db = require('../_lib/db');
export default function handler(req, res) {
  res.status(200).json({ total: db.total });
}
