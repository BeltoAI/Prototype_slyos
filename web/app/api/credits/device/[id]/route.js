export const dynamic='force-dynamic'; export const runtime='nodejs';
import { NextResponse } from 'next/server'; import { getDb } from '../../../_lib/db';
export async function GET(_req,{params}){ const db=getDb(); return NextResponse.json({ credits: db.perDevice[params.id]||0 }); }
