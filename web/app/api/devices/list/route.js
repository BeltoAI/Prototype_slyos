import { NextResponse } from 'next/server'
import { getUser } from '../../../../lib/auth.js'
import { getMongo } from '../../../../lib/mongo.js'
import { ObjectId } from 'mongodb'
export async function GET(req){
  const u = getUser(req); if(!u) return NextResponse.json([])
  const {db}=await getMongo()
  const list = await db.collection('devices').find({userId:new ObjectId(u._id)})
    .sort({createdAt:-1}).toArray()
  return NextResponse.json(list.map(d=>({_id:String(d._id), model:d.model, osVersion:d.osVersion, lastSeenAt:d.lastSeenAt})))
}
