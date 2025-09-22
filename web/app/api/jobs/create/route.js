import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getMongo } from '../../../../lib/mongo.js'

export async function POST(req){
  const { db } = await getMongo()
  let body = {}
  try { body = await req.json() } catch {}

  const type = body.type || 'text_embed'
  const credit = Number(body.credit) || 1
  const inputs = Array.isArray(body.inputs) ? body.inputs : []

  if (!inputs.length) {
    return NextResponse.json({ message: 'no inputs' }, { status:400 })
  }

  // Use only _id; do NOT set job_id
  const jobId = new ObjectId()
  await db.collection('jobs').insertOne({
    _id: jobId,
    type,
    credit,
    inputsCount: inputs.length,
    createdAt: new Date(),
  })

  const units = inputs.map((item) => ({
    _id: new ObjectId(),
    jobId,
    type,
    status: 'ready',
    payload: type === 'http_task' ? { url: String(item) } : { text: String(item) },
    creditValue: credit,
    createdAt: new Date(),
  }))

  if (units.length) await db.collection('job_units').insertMany(units)

  return NextResponse.json({ jobId: jobId.toString(), units: units.length })
}
