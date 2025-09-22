"use client";
import { useEffect, useState } from "react";

export default function Home(){
  const [type,setType]=useState("text_embed");
  const [credit,setCredit]=useState(1);
  const [inputs,setInputs]=useState("hello\nworld");
  const [msg,setMsg]=useState("");

  const [info,setInfo]=useState({ total:0, cap:null, remaining:null });
  const [stats,setStats]=useState({ ready:0, claimed:0, done:0 });
  const [devices,setDevices]=useState([]);

  async function call(path, opts={}){
    const res = await fetch(path, opts);
    let data=null; try{ data=await res.json(); }catch(_){}
    return {ok:res.ok, data};
  }

  async function refresh(){
    const i = await call("/api/credits/info"); if(i.ok) setInfo(i.data);
    const s = await call("/api/stats");
    const counts = Object.fromEntries((s?.data?.counts||[]).map(x=>[x._id,x.n]));
    setStats({ ready:counts.ready||0, claimed:counts.claimed||0, done:counts.done||0 });
    const d = await call("/api/devices/credits"); setDevices(d?.data?.devices||[]);
  }
  useEffect(()=>{ refresh(); },[]);

  async function createJob(){
    const body = {
      type,
      credit:Number(credit)||1,
      inputs: inputs.split("\n").map(s=>s.trim()).filter(Boolean)
    };
    const r = await call("/api/jobs/create",{
      method:"POST", headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if(r.ok){ setMsg(`Job created (${r.data.units} units)`); setInputs(""); }
    else { setMsg(r?.data?.message||"Create failed"); }
    await refresh();
  }

  const progress = (info.cap==null) ? null : Math.min(100, Math.round((info.total/info.cap)*100));

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">SlyOS — Global Worker Dashboard</h1>
      </header>

      {/* Credits + queue */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Credits (global)</div>
          <div className="text-2xl font-semibold">{info.total}</div>
          {progress!=null && (
            <div className="mt-2">
              <div className="text-xs text-gray-500">Cap: {info.cap} (remaining {info.remaining})</div>
              <div className="w-full h-2 bg-gray-200 rounded mt-1">
                <div className="h-2 bg-black rounded" style={{width:`${progress}%`}} />
              </div>
            </div>
          )}
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Queue</div>
          <div className="text-sm">ready: {stats.ready}</div>
          <div className="text-sm">claimed: {stats.claimed}</div>
          <div className="text-sm">done: {stats.done}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Devices</div>
          <div className="text-sm">{devices.length} registered</div>
        </div>
      </div>

      {/* Create Task */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="font-medium">Create task (distributed to ALL phones)</div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" checked={type==="text_embed"} onChange={()=>setType("text_embed")} />
            <span>Text embed</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" checked={type==="http_task"} onChange={()=>setType("http_task")} />
            <span>URL preview</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">Credit per unit</div>
          <input className="border p-2 w-24" value={credit} onChange={e=>setCredit(e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">{type==="http_task" ? "URLs (one per line)" : "Texts (one per line)"}</div>
          <textarea className="border p-2 w-full min-h-[140px]" value={inputs} onChange={e=>setInputs(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-black text-white rounded" onClick={createJob}>Create task</button>
          <button className="px-3 py-2 border rounded" onClick={refresh}>Refresh</button>
        </div>
        {msg && <div className="text-sm text-gray-600">{msg}</div>}
      </div>

      {/* Phones */}
      <div className="border rounded-lg p-4">
        <div className="font-medium mb-2">All phones</div>
        {devices.length===0 ? (
          <div className="text-sm text-gray-500">No devices yet. Open the Android app and tap “Register device”.</div>
        ) : (
          <div className="divide-y">
            {devices.map(d=>(
              <div key={d.deviceId} className="py-2 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{d.model || "Phone"} <span className="text-gray-500">({d.osVersion})</span></div>
                  <div className="text-gray-500">…{d.deviceId.slice(-6)}</div>
                </div>
                <div className="text-sm">Credits: <span className="font-semibold">{d.total}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Flow: create tasks → phones claim → submit → global credits increase.
      </p>
    </div>
  );
}
