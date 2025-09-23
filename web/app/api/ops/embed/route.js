export const dynamic='force-dynamic'; export const runtime='nodejs';
import { NextResponse } from 'next/server';
export async function POST(req){ let body={}; try{ body=await req.json(); }catch{} const t=String(body.text||""); return NextResponse.json({ embedding:[t.length*1.0,1.0,0.5] }); }
