'use client'
import {useState} from 'react'
export default function Auth(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [m,setM]=useState('')
  async function post(p){
    const r=await fetch(p,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({email,password})})
    const j=await r.json(); setM(j.message||JSON.stringify(j))
  }
  return <main className="max-w-md mx-auto card space-y-3">
    <div className="text-xl font-semibold">Login / Register</div>
    <input className="w-full bg-black/30 border border-white/10 rounded-xl p-3" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)}/>
    <input className="w-full bg-black/30 border border-white/10 rounded-xl p-3" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)}/>
    <div className="flex gap-2">
      <button className="btn" onClick={()=>post('/api/auth/login')}>Login</button>
      <button className="btn" onClick={()=>post('/api/auth/register')}>Register</button>
    </div>
    <div className="opacity-80 text-sm">{m}</div>
  </main>
}
