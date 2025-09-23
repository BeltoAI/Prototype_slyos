export const dynamic='force-dynamic'; export const runtime='nodejs';
import { NextResponse } from 'next/server'; import { getDb } from '../../_lib/db';
function deviceId(req){ const u=new URL(req.url); return u.searchParams.get('deviceId') || req.headers.get('x-device-id') || 'unknown'; }
async function claim(req){
  const db=getDb(); const did=deviceId(req);
  for (const jid of Object.keys(db.jobs)) if (!db.jobs[jid].done){ db.jobs[jid].did=did; return NextResponse.json({ id: jid }); }
  const jid=String(db.nextId++); db.jobs[jid]={ text:`demo job #${jid}`, done:false, did }; return NextResponse.json({ id: jid });
}
export async function GET(req){ return claim(req); }
export async function POST(req){ return claim(req); }
