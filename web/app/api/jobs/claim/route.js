export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getDb } from '../../_lib/db';

function getDeviceId(req) {
  const q = new URL(req.url).searchParams.get('deviceId');
  return q || req.headers.get('x-device-id') || 'unknown';
}

async function doClaim(req) {
  const db = getDb();
  const did = getDeviceId(req);
  for (const jid of Object.keys(db.jobs)) {
    if (!db.jobs[jid].done) {
      db.jobs[jid].did = did;
      return NextResponse.json({ id: jid });
    }
  }
  const jid = String(db.nextId++);
  db.jobs[jid] = { text: `demo job #${jid}`, done: false, did };
  return NextResponse.json({ id: jid });
}

export async function GET(req)  { return doClaim(req); }
export async function POST(req) { return doClaim(req); }
