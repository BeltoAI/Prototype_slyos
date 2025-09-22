import { verify } from '../lib/jwt.js'
export function getUser(req){
  const b=req.headers.get('authorization')
  const c=req.cookies.get('slyos_token')?.value
  const t=b?.startsWith('Bearer ')?b.slice(7):c
  if(!t) return null; try{ return verify(t) }catch{ return null }
}
