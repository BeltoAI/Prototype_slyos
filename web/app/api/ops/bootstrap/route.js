import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'

export async function POST() {
  const { db } = await getMongo()
  await db.collection('job_units').createIndexes([
    { key: { status: 1, createdAt: 1 } },
    { key: { claimedByDevice: 1 } },
  ])
  await db.collection('credits').createIndexes([
    { key: { unitId: 1 }, unique: true },
    { key: { deviceId: 1 } },
  ])
  await db.collection('devices').createIndex({ createdAt: 1 })
  return NextResponse.json({ ok: true })
}
