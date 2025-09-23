export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(){ return new Response('pong\n',{status:200}); }
