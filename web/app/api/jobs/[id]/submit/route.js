export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getDb } from '../../../_lib/db';

export async function POST(req, { params }) {
  const db = getDb();
  const id = params.id;
  let body = {};
  try { body = await req.json(); } catch {}
  const qDid = new URL(req.url).searchParams.get('deviceId');
  const headerDid = req.headers.get('x-device-id');
  const did = qDid || headerDid || (body && body.deviceId) || db.jobs[id]?.did || 'unknown';
  if (!db.jobs[id]) db.jobs[id] = { text: "", done: false };
  db.jobs[id].done = true;
  db.perDevice[did] = (db.perDevice[did] || 0) + 1;
  db.total += 1;
  return NextResponse.json({ ok: true });
}
