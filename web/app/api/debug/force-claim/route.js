import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
import { ObjectId } from 'mongodb'
export async function POST(req){
  const { db } = await getMongo()
  const { unitId, deviceId } = await req.json()
  if(!unitId||!ObjectId.isValid(unitId)||!deviceId||!ObjectId.isValid(deviceId))
    return NextResponse.json({message:'bad ids'},{status:400})
  const ok = await db.collection('job_units').updateOne(
    { _id:new ObjectId(unitId), status:'ready' },
    { $set:{ status:'claimed', claimedByDevice:new ObjectId(deviceId), claimedAt:new Date() } }
  )
  return NextResponse.json({ claimed: ok.modifiedCount>0 })
}
