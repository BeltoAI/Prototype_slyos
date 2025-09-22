import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
import { ObjectId } from 'mongodb'

export async function POST(req){
  const { db } = await getMongo()
  let body={}
  try{ body = await req.json() }catch(_){}
  const { deviceId } = body

  if(!deviceId || !ObjectId.isValid(deviceId)){
    return NextResponse.json({ message:'bad deviceId' }, { status:400 })
  }

  const dev = await db.collection('devices').findOne({ _id:new ObjectId(deviceId) })
  if(!dev) return NextResponse.json({ message:'device not found' }, { status:404 })

  // quick count for visibility
  const readyCount = await db.collection('job_units').countDocuments({ status:'ready' })

  // step 1: peek a ready unit
  const ready = await db.collection('job_units').findOne({ status:'ready' })
  if(!ready){
    return NextResponse.json({ claimed:false, message:'no task', readyCount })
  }

  // step 2: guarded claim (only if still ready)
  const now = new Date()
  const upd = await db.collection('job_units').updateOne(
    { _id: ready._id, status:'ready' },
    { $set:{
        status:'claimed',
        claimedByDevice: new ObjectId(deviceId),
        claimedAt: now,
        deadlineAt: new Date(now.getTime() + 15*60*1000)
      }
    }
  )
  if(upd.modifiedCount === 0){
    // lost a race; tell caller to retry
    return NextResponse.json({ claimed:false, message:'no task', readyCount })
  }

  console.log('CLAIM -> unit', String(ready._id), 'type', ready.type, 'by', deviceId)
  return NextResponse.json({
    _id: ready._id.toString(),
    type: ready.type,
    payload: ready.payload,
    creditValue: ready.creditValue ?? 0,
    jobId: ready.jobId?.toString()
  })
}
