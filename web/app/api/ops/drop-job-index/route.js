import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'

export async function POST(){
  const { db } = await getMongo()
  let dropped = false
  try {
    await db.collection('jobs').dropIndex('job_id_1')
    dropped = true
  } catch (e) {
    // index not found is fine
  }
  const idx = await db.collection('jobs').indexes()
  return NextResponse.json({ ok:true, dropped, indexes: idx.map(i=>i.name) })
}
