import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
import { sign } from '../../../../lib/jwt.js'
import bcrypt from 'bcryptjs'
export async function POST(req){
  const {email,password}=await req.json()
  if(!email||!password) return NextResponse.json({message:'missing'},{status:400})
  const {db}=await getMongo(); const U=db.collection('users')
  if(await U.findOne({email})) return NextResponse.json({message:'exists'},{status:400})
  const r=await U.insertOne({email,password_hash:await bcrypt.hash(password,10),role:'user',createdAt:new Date()})
  const token=sign({_id:r.insertedId.toString(),email,role:'user'})
  const res=NextResponse.json({message:'registered',token}); res.cookies.set('slyos_token',token,{httpOnly:true,sameSite:'lax',path:'/'})
  return res
}
