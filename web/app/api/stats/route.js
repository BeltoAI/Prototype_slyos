import { NextResponse } from 'next/server'
import { getMongo } from '../../../lib/mongo.js'
export async function GET(){
  const { db } = await getMongo()
  const rows = await db.collection('job_units').aggregate([
    { $group:{ _id:'$status', n:{ $sum:1 } } }
  ]).toArray()
  return NextResponse.json({ counts: rows })
}
