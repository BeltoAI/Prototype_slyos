export const dynamic='force-dynamic'; export const runtime='nodejs';
import { NextResponse } from 'next/server'; import { getDb } from '../../../_lib/db';
export async function POST(req,{params}) {
  const db=getDb(); const id=params.id; let body={}; try{ body=await req.json(); }catch{}
  const u=new URL(req.url); const did=u.searchParams.get('deviceId') || req.headers.get('x-device-id') || body.deviceId || db.jobs[id]?.did || 'unknown';
  if (!db.jobs[id]) db.jobs[id]={ text:"", done:false };
  db.jobs[id].done=true; db.perDevice[did]=(db.perDevice[did]||0)+1; db.total+=1;
  return NextResponse.json({ ok:true });
}
