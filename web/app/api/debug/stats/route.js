import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
export async function GET(){
  const {db}=await getMongo()
  const counts = await db.collection('job_units').aggregate([{$group:{_id:'$status', n:{$sum:1}}}]).toArray()
  const one = await db.collection('job_units').findOne({status:'ready'})
  return NextResponse.json({counts, sample: one ? {_id:String(one._id), payload:one.payload, status:one.status} : null})
}
