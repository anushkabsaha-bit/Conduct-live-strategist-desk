import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Download, ArrowRightLeft } from "lucide-react";
import { Btn, Empty, Field, Kicker, PageHead, Tag } from "./kit";
import AgentRunCard from "./AgentRunCard";
import MakeTask from "./MakeTask";
import { create, http, list, listRuns, recordDecision, remove, update } from "../lib/api";

const seeding = {};

async function exportWorkspace(w, cfg) {
  const runs = await listRuns({ ref_type: "workspace", ref_id: w.id });
  const lines = [`# ${w.name}`, `Room: ${cfg.title} | Status: ${w.status}`, "", ...cfg.fields.map((f) => `## ${f.label}\n${w.data?.[f.k] || "(empty)"}`), "", "# Agent outputs (recorded)"];
  runs.forEach((r) => lines.push(`\n## ${r.agent.toUpperCase()} · ${r.task} · ${r.created_at.slice(0, 16)}\n${JSON.stringify(r.output, null, 2)}`));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown" }));
  a.download = `${w.name.replace(/\W+/g, "-")}.md`; a.click();
}

function Fields({ w, cfg, save }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {cfg.fields.map((f) => (
        <div key={f.k} className={f.wide ? "md:col-span-2" : ""}>
          <Field label={f.label}>
            {f.options ? (
              <select data-testid={`ws-${f.k}`} className="field" value={w.data?.[f.k] || ""} onChange={(e) => save(f.k, e.target.value)}><option value="">Choose…</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
            ) : (
              <textarea data-testid={`ws-${f.k}`} className="field" rows={f.rows || 2} defaultValue={w.data?.[f.k] || ""} placeholder={f.ph || ""} onBlur={(e) => e.target.value !== (w.data?.[f.k] || "") && save(f.k, e.target.value)} />
            )}
          </Field>
        </div>
      ))}
    </div>
  );
}

export default function Room({ cfg }) {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const id = params.get("id");
  const load = useCallback(async () => {
    let all = (await list("workspaces")).filter((x) => x.room === cfg.key);
    if ((!all.length || seeding[cfg.key]) && cfg.example) {
      seeding[cfg.key] = seeding[cfg.key] || create("workspaces", { room: cfg.key, name: cfg.example.name, status: cfg.statuses[0], data: cfg.example.data, label: cfg.example.label, links: [] });
      await seeding[cfg.key];
      all = (await list("workspaces")).filter((x) => x.room === cfg.key);
    }
    setItems(all);
    if (!params.get("id") && all[0]) setParams({ id: all[0].id }, { replace: true });
  }, [cfg.key]); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  const w = items.find((x) => x.id === id);
  const save = async (k, v) => { await update("workspaces", w.id, { data: { ...w.data, [k]: v } }); load(); };
  const add = async (example) => {
    const n = await create("workspaces", { room: cfg.key, name: example ? cfg.example.name : `New ${cfg.noun}`, status: cfg.statuses[0], data: example ? cfg.example.data : {}, label: example ? cfg.example.label : "", links: [] });
    await load(); setParams({ id: n.id });
  };
  const setStatus = async (s) => { await update("workspaces", w.id, { status: s }); await recordDecision({ ref_type: "workspace", ref_id: w.id, choice: `status:${s}`, note: `${cfg.title}: status set by Anushka` }); toast.success(`Status: ${s}`); load(); };
  const handTo = async (target) => {
    const t = cfg.handoffs.find((h) => h.key === target);
    const runs = await listRuns({ ref_type: "workspace", ref_id: w.id });
    const summary = runs.slice(0, 4).map((r) => `${r.agent.toUpperCase()} ${r.task}: ${JSON.stringify(r.output).slice(0, 600)}`).join("\n");
    await create("handoffs", { from_room: cfg.key, to_room: target, ref_id: w.id, excerpt: summary.slice(0, 2500) });
    if (target === "content") {
      const d = await create("drafts", { title: `From ${cfg.title}: ${w.name}`, format: "LinkedIn post", audience: w.data?.audience || "", objective: "", word_limit: null, status: "draft", brief: { subject: w.name, source_material: `${Object.entries(w.data || {}).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nRecorded agent work:\n${summary}` }, versions: [{ n: 1, text: "", note: `Handed over from ${cfg.title}`, source: "handoff", created_at: new Date().toISOString() }] });
      nav(`/content?draft=${d.id}`);
    } else {
      const n = await create("workspaces", { room: target, name: `${w.name} (from ${cfg.title})`, status: t.status, data: t.map ? t.map(w) : {}, label: "Handed over with recorded context", links: [{ room: cfg.key, id: w.id }], context: summary.slice(0, 4000) });
      nav(`${t.path}?id=${n.id}`);
    }
    toast.success(`Handed to ${t.label} with its recorded context`);
  };
  return (
    <div>
      <PageHead n={cfg.n} kicker={cfg.title} title={cfg.title} accent="." sub={cfg.sub} />
      <section className="bg-linen text-chocolate px-5 md:px-10 pb-16">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <aside>
            <div className="flex items-center justify-between mb-2"><p className="kicker text-tangelo">Saved {cfg.noun}s</p><Btn variant="line" className="!px-2 !py-1" data-testid="ws-new" onClick={() => add(false)}><Plus className="w-3 h-3" />New</Btn></div>
            <div className="border-t-2 border-chocolate">
              {items.map((x) => (
                <button key={x.id} data-testid={`ws-item-${x.id}`} onClick={() => setParams({ id: x.id })} className={`w-full text-left px-2 py-3 border-b border-chocolate/25 transition-colors ${x.id === id ? "bg-chocolate text-linen" : "hover:bg-botticelli/20"}`}>
                  <p className="font-mono text-xs font-bold">{x.name}</p><p className="font-mono text-[10px] opacity-70 mt-1">{x.status}</p>
                </button>
              ))}
            </div>
            {cfg.example && <button data-testid="ws-load-example" onClick={() => add(true)} className="mt-3 font-mono text-[10px] tracking-[0.14em] uppercase text-tangelo underline-grow">+ Load worked example</button>}
          </aside>
          {!w ? <Empty title={`No ${cfg.noun} yet.`}>Start a new one or load the worked example.</Empty> : (
            <div className="space-y-8 min-w-0" key={w.id}>
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <input data-testid="ws-name" className="field !text-lg !font-bold max-w-xl" defaultValue={w.name} onBlur={(e) => update("workspaces", w.id, { name: e.target.value }).then(load)} />
                <div className="flex flex-wrap gap-2 items-center">
                  <select data-testid="ws-status" className="field !w-auto" value={w.status} onChange={(e) => setStatus(e.target.value)}>{cfg.statuses.map((s) => <option key={s}>{s}</option>)}</select>
                  <Btn variant="line" data-testid="ws-export" onClick={() => exportWorkspace(w, cfg)}><Download className="w-3.5 h-3.5" />Export</Btn>
                </div>
              </div>
              {w.label && <Tag tone="blue">{w.label}</Tag>}
              {w.context && <details className="border border-chocolate/30 bg-paper p-3"><summary className="kicker text-tangelo cursor-pointer">Context handed over from another room</summary><pre className="whitespace-pre-wrap font-mono text-[11px] mt-2">{w.context}</pre></details>}
              <Fields w={w} cfg={cfg} save={save} />
              <Kicker>Workflow · {cfg.steps.map((s) => s.agent.toUpperCase()).join(" → ")}</Kicker>
              <div className="space-y-6">
                {cfg.steps.map((s, i) => <AgentRunCard key={s.task + i} dark={s.agent === "ana"} agent={s.agent} task={s.task} refType="workspace" refId={w.id} label={`${String(i + 1).padStart(2, "0")} · ${s.label}`} hint={s.hint} getInput={s.input ? () => s.input(w) : undefined} />)}
              </div>
              <div className="bg-chocolate text-linen p-5 flex flex-wrap items-center gap-4 justify-between" data-testid="ws-actions">
                <div className="flex flex-wrap items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-tangelo" />{cfg.handoffs.map((h) => <Btn key={h.key} variant="lineDark" data-testid={`ws-handoff-${h.key}`} onClick={() => handTo(h.key)}>Hand to {h.label}</Btn>)}</div>
                <MakeTask dark title={`${cfg.title}: next step for ${w.name}`} agent={cfg.steps[cfg.steps.length - 1].agent} why={`Saved ${cfg.noun} in ${cfg.title}`} context={{ room: cfg.key, workspace_id: w.id }} />
              </div>
              <Btn variant="ghost" data-testid="ws-delete" onClick={async () => { if (window.confirm("Delete this item?")) { await remove("workspaces", w.id); setParams({}); load(); } }}><Trash2 className="w-3.5 h-3.5" />Delete</Btn>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export const searchApi = (q) => http.get("/search", { params: { q } }).then((r) => r.data);
