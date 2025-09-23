const db = require('../../_lib/db');
export default function handler(req, res) {
  const { id } = req.query;
  const text = (db.jobs[id] && db.jobs[id].text) || "";
  res.status(200).send(text);
}
