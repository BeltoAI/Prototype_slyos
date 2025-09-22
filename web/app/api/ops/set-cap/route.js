import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const cap = Number(searchParams.get('cap'))
  if(!Number.isFinite(cap) || cap < 0) return NextResponse.json({message:'bad cap'},{status:400})
  const { db } = await getMongo()
  await db.collection('credit_caps').updateOne(
    { _id:'global' }, { $set:{ cap } }, { upsert:true }
  )
  return NextResponse.json({ ok:true, cap })
}
