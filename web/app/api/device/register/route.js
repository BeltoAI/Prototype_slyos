export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getDb } from '../../_lib/db';

export async function POST(req) {
  const db = getDb();
  let body = {};
  try { body = await req.json(); } catch {}
  const headerId = req.headers.get('x-device-id');
  const id = body.deviceId || headerId || `debug-${Math.floor(Math.random()*1e8).toString().padStart(8,'0')}`;
  if (!db.perDevice[id]) db.perDevice[id] = 0;
  return NextResponse.json({ id });
}
