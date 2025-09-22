import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
export async function POST(){
  const { db } = await getMongo()
  const r = await db.collection('job_units').updateMany(
    { status:'claimed' },
    { $set:{ status:'ready' }, $unset:{ claimedByDevice:"", claimedAt:"", deadlineAt:"" } }
  )
  return NextResponse.json({ reset:r.modifiedCount })
}
