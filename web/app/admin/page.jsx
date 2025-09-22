"use client";
import { useState } from "react";

export default function Admin(){
  const [type,setType]=useState("text_embed");
  const [credit,setCredit]=useState(1);
  const [inputs,setInputs]=useState("hello\nworld");
  const [msg,setMsg]=useState("");

  async function createJob(){
    const body = {
      type,
      credit:Number(credit)||1,
      inputs: inputs.split("\n").map(s=>s.trim()).filter(Boolean)
    };
    const res = await fetch("/api/jobs/create",{
      method:"POST", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });
    const j = await res.json().catch(()=>({}));
    setMsg(res.ok ? `Job created: ${j.jobId}` : (j.message||"Failed (are you admin?)"));
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Admin — Create Job</h1>
      <div className="border rounded-lg p-4 space-y-3">
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
        <div>
          <div className="text-sm text-gray-500 mb-1">Credit per unit</div>
          <input className="border p-2 w-24" value={credit} onChange={e=>setCredit(e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">
            {type==="http_task" ? "URLs (one per line)" : "Texts (one per line)"}
          </div>
          <textarea className="border p-2 w-full min-h-[140px]" value={inputs} onChange={e=>setInputs(e.target.value)} />
        </div>
        <button className="px-3 py-2 bg-black text-white rounded" onClick={createJob}>Create Job</button>
        {msg && <div className="text-sm text-gray-600">{msg}</div>}
      </div>
      <p className="text-sm text-gray-500">Note: If you just promoted yourself to admin via API, log out/in once so the token includes the role.</p>
    </div>
  );
}
