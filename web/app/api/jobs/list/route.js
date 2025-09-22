import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
export async function GET(){
  const {db}=await getMongo()
  const jobs = await db.collection('jobs').find({}, {projection:{spec:1,status:1,createdAt:1,totalUnits:1}})
    .sort({createdAt:-1}).limit(10).toArray()
  const counts = await db.collection('job_units').aggregate([{$group:{_id:'$status', n:{$sum:1}}}]).toArray()
  return NextResponse.json({jobs: jobs.map(j=>({...j, _id:String(j._id)})), counts})
}
