import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
import { ObjectId } from 'mongodb'

export async function POST(req){
  const { db } = await getMongo()
  let body = {}
  try { body = await req.json() } catch (_) {}
  const { jobUnitId, deviceId, result, runtimeMs = 0 } = body

  if(!jobUnitId || !ObjectId.isValid(jobUnitId)) return NextResponse.json({ message:'bad jobUnitId' }, { status:400 })
  if(!deviceId  || !ObjectId.isValid(deviceId))  return NextResponse.json({ message:'bad deviceId' }, { status:400 })

  const dev = await db.collection('devices').findOne({ _id:new ObjectId(deviceId) })
  if(!dev) return NextResponse.json({ message:'device not found' }, { status:404 })

  const unit = await db.collection('job_units').findOne({ _id:new ObjectId(jobUnitId) })
  if(!unit) return NextResponse.json({ message:'unit not found' }, { status:404 })

  // ✅ robust device check (no string-vs-ObjectId weirdness)
  const sameDevice = unit.claimedByDevice && new ObjectId(deviceId).equals(unit.claimedByDevice)
  if(!sameDevice){
    console.warn(`SUBMIT BLOCKED -> unit ${jobUnitId} not claimed by ${deviceId} (claimedBy=${unit.claimedByDevice})`)
    return NextResponse.json({ message:'not claimed by this device' }, { status:409 })
  }

  // mark done
  await db.collection('job_units').updateOne(
    { _id: unit._id },
    { $set:{
        status:'done',
        result: result ?? { status:'ok' },
        finishedAt:new Date(),
        runtimeMs: Number(runtimeMs)||0
      }
    }
  )

  // 💳 credit the device (idempotent per unit)
  const creditVal = unit.creditValue || 0
  let credited = 0
  if (creditVal > 0) {
    const already = await db.collection('credits').findOne({ unitId: unit._id })
    if(!already){
      await db.collection('credits').insertOne({
        unitId: unit._id,
        jobId: unit.jobId,
        deviceId: new ObjectId(deviceId),
        amount: creditVal,
        createdAt: new Date()
      })
      credited = creditVal
    }
  }

  console.log(`SUBMIT -> unit ${jobUnitId} by ${deviceId} (+${credited})`)
  return NextResponse.json({ ok:true, creditAdded: credited })
}
