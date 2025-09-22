import { NextResponse } from 'next/server'
import { getMongo } from '../../../../lib/mongo.js'
import { sign } from '../../../../lib/jwt.js'
import bcrypt from 'bcryptjs'
export async function POST(req){
  const {email,password}=await req.json()
  const {db}=await getMongo(); const u=await db.collection('users').findOne({email})
  if(!u) return NextResponse.json({message:'no user'},{status:400})
  if(!(await bcrypt.compare(password,u.password_hash||''))) return NextResponse.json({message:'bad creds'},{status:400})
  const token=sign({_id:u._id.toString(),email:u.email,role:u.role})
  const res=NextResponse.json({message:'signed in',token}); res.cookies.set('slyos_token',token,{httpOnly:true,sameSite:'lax',path:'/'})
  return res
}
