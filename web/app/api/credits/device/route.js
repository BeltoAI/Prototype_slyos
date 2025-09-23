export const dynamic='force-dynamic'; export const runtime='nodejs';
import { NextResponse } from 'next/server';
import { getDb } from '../../_lib/db';
export async function GET(req){
  const u=new URL(req.url);
  const id=u.searchParams.get('deviceId') || '';
  if(!id) return NextResponse.json({ error:'deviceId required' },{ status:400 });
  const db=getDb(); return NextResponse.json({ credits: db.perDevice[id]||0 });
}
