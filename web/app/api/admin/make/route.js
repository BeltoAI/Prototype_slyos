import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
export async function POST(req){
  const {email}=await req.json()
  const {db}=await getMongo()
  const r=await db.collection('users').updateOne({email},{ $set:{role:'admin'} })
  return NextResponse.json({updated:r.modifiedCount})
}
