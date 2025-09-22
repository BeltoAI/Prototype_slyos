import { NextResponse } from 'next/server'
import { getUser } from '../../../../lib/auth.js'
import { getMongo } from '../../../../lib/mongo.js'
import { ObjectId } from 'mongodb'
export async function GET(req){
  const u=getUser(req); if(!u) return NextResponse.json({total:0})
  const {db}=await getMongo()
  const agg=await db.collection('credits_ledger').aggregate([
    {$match:{userId:new ObjectId(u._id)}},
    {$group:{_id:null,total:{$sum:'$delta'}}}
  ]).toArray()
  return NextResponse.json({total:agg[0]?.total||0})
}
