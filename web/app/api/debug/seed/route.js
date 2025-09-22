import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
import { ObjectId } from 'mongodb'
export async function POST(){
  const {db}=await getMongo()
  const now=new Date()
  await db.collection('job_units').insertMany([
    {jobId:new ObjectId(), type:'http_task',  payload:{url:'https://example.com'}, creditValue:1, status:'ready', createdAt:now},
    {jobId:new ObjectId(), type:'text_embed', payload:{text:'hello world'},        creditValue:1, status:'ready', createdAt:now}
  ])
  return NextResponse.json({seeded:2})
}
