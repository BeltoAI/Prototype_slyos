export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getDb } from '../../_lib/db';

export async function GET() {
  const db = getDb();
  return NextResponse.json({ total: db.total });
}
