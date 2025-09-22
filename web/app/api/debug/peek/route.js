import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
export async function GET(){
  const { db } = await getMongo()
  const doc = await db.collection('job_units').findOne({ status:'ready' }, { sort:{ createdAt:1 } })
  return NextResponse.json(doc ? { _id:String(doc._id), type:doc.type, payload:doc.payload } : { none:true })
}
