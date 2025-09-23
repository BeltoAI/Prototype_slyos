export const dynamic='force-dynamic'; export const runtime='nodejs';
import { getDb } from '../../../_lib/db';
export async function GET(_req,{params}){ const db=getDb(); const txt=(db.jobs[params.id]?.text)||""; return new Response(txt,{status:200,headers:{'Content-Type':'text/plain; charset=utf-8'}}); }
