import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'

export async function GET(){
  const { db } = await getMongo()
  const agg = await db.collection('job_units').aggregate([
    { $match:{ status:'done' } },
    { $group:{ _id:null, total:{ $sum:{ $ifNull:['$creditValue',0] } } } }
  ]).toArray()
  const total = agg[0]?.total || 0
  // (cap logic optional; omit or return nulls)
  return NextResponse.json({ total, cap:null, remaining:null })
}
