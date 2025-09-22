import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
import { ObjectId } from 'mongodb'
import crypto from 'node:crypto'

export async function POST(){
  const { db } = await getMongo()
  // ensure a host device exists
  const dev = await db.collection('devices').findOneAndUpdate(
    { model:'Host', osVersion:'0' },
    { $setOnInsert:{ model:'Host', osVersion:'0', createdAt:new Date() } },
    { upsert:true, returnDocument:'after' }
  )
  const deviceId = dev.value?._id?.toString()

  const now = new Date()
  const unit = await db.collection('job_units').findOneAndUpdate(
    { status:'ready' },
    { $set:{ status:'claimed', claimedByDevice:new ObjectId(deviceId), claimedAt:now, deadlineAt:new Date(now.getTime()+15*60*1000) } },
    { sort:{ createdAt:1 }, returnDocument:'after' }
  )
  if(!unit.value) return NextResponse.json({ claimed:false, message:'no task' })

  const v = unit.value
  let preview = 'unknown'
  try{
    if(v.type === 'http_task'){
      const url = v.payload?.url
      const res = await fetch(url)
      const txt = await res.text()
      preview = txt.slice(0,200)
    } else if(v.type === 'text_embed'){
      const text = v.payload?.text ?? ''
      const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0,16)
      preview = 'embedding:' + hash
    }
  }catch(_){ preview = 'err' }

  await db.collection('job_units').updateOne(
    { _id: v._id },
    { $set:{ status:'done', result:{ status:'ok', preview }, finishedAt:new Date(), runtimeMs:0 } }
  )
  return NextResponse.json({ claimed:true, submitted:true, creditAdded:v.creditValue||0, unitId:v._id.toString(), type:v.type, preview })
}
