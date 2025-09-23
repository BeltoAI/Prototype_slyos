export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const body = (typeof req.body === 'object' && req.body) ? req.body : {};
  const txt = String(body.text || "");
  res.status(200).json({ embedding: [txt.length * 1.0, 1.0, 0.5] });
}
