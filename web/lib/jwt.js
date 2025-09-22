import jwt from 'jsonwebtoken'
const SECRET = process.env.JWT_SECRET
export const sign = (p)=>jwt.sign(p,SECRET,{expiresIn:'7d'})
export const verify = (t)=>jwt.verify(t,SECRET)
