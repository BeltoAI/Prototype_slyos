import { NextResponse } from 'next/server'
import { getUser } from '../../../lib/auth.js'
export async function GET(req){ return NextResponse.json(getUser(req) || {}) }
