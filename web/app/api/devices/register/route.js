import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'

export async function POST(req){
  const { db } = await getMongo()
  let body={}
  try{ body = await req.json() }catch(_){}
  const { model='Android', osVersion='?' } = body
  const now = new Date()
  const r = await db.collection('devices').insertOne({ model, osVersion, createdAt:now })
  return NextResponse.json({ deviceId: r.insertedId.toString(), model, osVersion })
}
