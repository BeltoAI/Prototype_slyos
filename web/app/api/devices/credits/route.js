import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
import { ObjectId } from 'mongodb'

export async function GET(req){
  const { db } = await getMongo()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('deviceId')

  if(id){
    if(!ObjectId.isValid(id)) return NextResponse.json({ message:'bad deviceId' }, { status:400 })
    const agg = await db.collection('job_units').aggregate([
      { $match:{ status:'done', claimedByDevice:new ObjectId(id) } },
      { $group:{ _id:null, total:{ $sum:{ $ifNull:['$creditValue',0] } } } }
    ]).toArray()
    return NextResponse.json({ deviceId:id, total: agg[0]?.total || 0 })
  }

  const devices = await db.collection('devices').find({}, { projection:{ model:1, osVersion:1 } }).toArray()
  if(devices.length===0) return NextResponse.json({ devices:[] })

  const ids = devices.map(d=>d._id)
  const rows = await db.collection('job_units').aggregate([
    { $match:{ status:'done', claimedByDevice:{ $in: ids } } },
    { $group:{ _id:'$claimedByDevice', total:{ $sum:{ $ifNull:['$creditValue',0] } } } }
  ]).toArray()
  const totals = Object.fromEntries(rows.map(r=>[r._id.toString(), r.total]))
  const out = devices.map(d=>({ deviceId:d._id.toString(), model:d.model, osVersion:d.osVersion, total: totals[d._id.toString()]||0 }))
  return NextResponse.json({ devices: out })
}
