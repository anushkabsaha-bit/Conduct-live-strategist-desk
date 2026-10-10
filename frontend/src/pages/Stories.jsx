import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { Btn, Empty, Field, Kicker, PageHead, Tag } from "../components/kit";
import { Output } from "../components/Output";
import AgentRunCard from "../components/AgentRunCard";
import MakeTask from "../components/MakeTask";
import { create, list, recordDecision, remove, update } from "../lib/api";
import { STAGES } from "../lib/meta";
import { useNavigate } from "react-router-dom";
import { listRuns } from "../lib/api";

const FACT = { verified: "green", dataset: "blue", stated_unsourced: "line", unverified: "solid" };

function ListEditor({ items, onChange, placeholder, testid }) {
  const [v, setV] = useState("");
  return (
    <div>
      {items.map((x, i) => (
        <div key={i} className="flex items-start gap-2 py-1.5 border-b border-chocolate/15 font-mono text-xs">
          <span className="flex-1">{x}</span><button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-chocolate/40 hover:text-tangelo"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input data-testid={testid} className="field" value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onChange([...items, v.trim()]); setV(""); } }} />
        <Btn variant="line" onClick={() => { if (v.trim()) { onChange([...items, v.trim()]); setV(""); } }}>Add</Btn>
      </div>
    </div>
  );
}

function HandOff({ s }) {
  const nav = useNavigate();
  const go = async (target) => {
    const runs = await listRuns({ ref_type: "story", ref_id: s.id });
    const ctx = runs.slice(0, 4).map((r) => `${r.agent.toUpperCase()} ${r.task}: ${JSON.stringify(r.output).slice(0, 700)}`).join("\n");
    const facts = (s.known_facts || []).map((f) => `[${f.status}] ${f.fact}`).join("\n");
    await create("handoffs", { from_room: "stories", to_room: target, ref_id: s.id, excerpt: ctx.slice(0, 2500) });
    if (target === "content") {
      const d = await create("drafts", { title: `Story: ${s.title}`, format: "LinkedIn post", audience: s.audience, objective: "", word_limit: null, status: "draft", brief: { subject: s.title, coverage: "First time covering this", source_material: `${s.what_happened}\n\nFacts:\n${facts}\n\nRecorded agent work:\n${ctx}`, source_url: s.source_url || "" }, versions: [{ n: 1, text: "", note: "Handed over from Stories", source: "handoff", created_at: new Date().toISOString() }] });
      nav(`/content?draft=${d.id}`);
    } else {
      const w = await create("workspaces", { room: "launch", name: `Launch from story: ${s.title}`, status: "Planning", label: "HYPOTHETICAL launch built from a story brief. Statuses are set by you.", links: [{ room: "stories", id: s.id }], context: ctx.slice(0, 4000), data: { facts, audience: s.audience, channels: (s.formats || []).join("\n") } });
      nav(`/launch?id=${w.id}`);
    }
    toast.success("Handed over with facts and recorded agent work");
  };
  return <div className="bg-chocolate text-linen p-5 flex flex-wrap gap-2" data-testid="story-handoff"><Btn variant="lineDark" data-testid="story-to-content" onClick={() => go("content")}>Hand to Content Desk</Btn><Btn variant="lineDark" data-testid="story-to-launch" onClick={() => go("launch")}>Turn into a launch plan</Btn></div>;
}

function StoryDetail({ s, save, del }) {
  const [factText, setFactText] = useState("");
  const [factStatus, setFactStatus] = useState("unverified");
  const setStage = async (st) => { await save({ stage: st }); await recordDecision({ ref_type: "story", ref_id: s.id, choice: `stage:${st}`, note: "Stage changed by Anushka" }); };
  return (
    <div className="space-y-8" data-testid="story-detail">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2"><Field label="Story"><input data-testid="story-title-input" className="field" defaultValue={s.title} key={`t${s.id}`} onBlur={(e) => save({ title: e.target.value })} /></Field></div>
        <Field label="Stage (changed only by you)"><select data-testid="story-stage-select" className="field" value={s.stage} onChange={(e) => setStage(e.target.value)}>{STAGES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <div className="md:col-span-2"><Field label="What happened / what changed"><textarea data-testid="story-what-input" className="field" rows={3} defaultValue={s.what_happened} key={`w${s.id}`} onBlur={(e) => save({ what_happened: e.target.value })} /></Field></div>
        <Field label="Intended audience"><textarea className="field" rows={3} defaultValue={s.audience} key={`a${s.id}`} onBlur={(e) => save({ audience: e.target.value })} /></Field>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <p className="kicker text-tangelo mb-2">What we know, and how we know it</p>
          {(s.known_facts || []).map((f, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-b border-chocolate/15">
              <Tag tone={FACT[f.status] || "line"} className="shrink-0">{f.status.replace("_", " ")}</Tag>
              <span className="font-mono text-xs flex-1">{f.fact}</span>
              <button onClick={() => save({ known_facts: s.known_facts.filter((_, j) => j !== i) })} className="text-chocolate/40 hover:text-tangelo"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input data-testid="story-fact-input" className="field" value={factText} onChange={(e) => setFactText(e.target.value)} placeholder="Add a fact" />
            <select className="field !w-36" value={factStatus} onChange={(e) => setFactStatus(e.target.value)}>{Object.keys(FACT).map((k) => <option key={k} value={k}>{k.replace("_", " ")}</option>)}</select>
            <Btn variant="line" data-testid="story-fact-add" onClick={() => { if (factText.trim()) { save({ known_facts: [...(s.known_facts || []), { fact: factText.trim(), status: factStatus }] }); setFactText(""); } }}>Add</Btn>
          </div>
        </div>
        <div>
          <p className="kicker text-tangelo mb-2">Unanswered questions</p>
          <ListEditor testid="story-question-input" items={s.open_questions || []} onChange={(v) => save({ open_questions: v })} placeholder="Add a question" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div data-testid="story-approvals">
          <p className="kicker text-tangelo mb-2">Approvals & permissions</p>
          {Object.entries(s.approvals || {}).map(([k, v]) => (
            <label key={k} className="flex items-center gap-3 py-1.5 font-mono text-xs cursor-pointer">
              <input type="checkbox" className="accent-tangelo w-4 h-4" checked={v} onChange={() => save({ approvals: { ...s.approvals, [k]: !v } })} />{k}
            </label>
          ))}
          <p className="font-mono text-[10px] text-chocolate/60 mt-2">Ticking is your record that approval was obtained. Agents never tick these.</p>
        </div>
        <div>
          <p className="kicker text-tangelo mb-2">Potential formats & channels</p>
          <ListEditor items={s.formats || []} onChange={(v) => save({ formats: v })} placeholder="e.g. Substack" />
        </div>
      </div>
      <div className="space-y-6">
        <Kicker>Agent workflow · EDITH → BERDINE → DIANA → ANA</Kicker>
        <AgentRunCard agent="edith" task="edith.story_brief" refType="story" refId={s.id} label="Is there a story?" hint="EDITH checks what is known, asks focused questions, and lists proof points, approvals and what is public." />
        <AgentRunCard agent="berdine" task="berdine.story_angles" refType="story" refId={s.id} label="Editorial angles" hint="Best run after EDITH's brief. BERDINE will say if evidence is insufficient." />
        <AgentRunCard agent="diana" task="diana.story_campaign" refType="story" refId={s.id} label="Campaign & distribution" />
        <AgentRunCard agent="ana" task="ana.next_steps" refType="story" refId={s.id} label="Next steps & dependencies"
          render={(o, r) => (<div><Output data={o} /><div className="mt-4 flex flex-wrap gap-4">{(o.next_steps || []).map((n, i) => <MakeTask key={i} testid={`story-step-task-${i}`} label={`Task: ${n.step.slice(0, 40)}…`} title={n.step} agent="edith" why={`Story: ${s.title}`} nextAction={n.step} context={{ source: "ana.next_steps", run_id: r.id, story_id: s.id, step: n }} />)}</div></div>)} />
      </div>
      {s.source_url && <a href={s.source_url} target="_blank" rel="noreferrer" data-testid="story-source-link" className="font-mono text-xs text-tangelo underline-grow">Public source</a>}
      <HandOff s={s} />
      <Btn variant="ghost" data-testid="story-delete-btn" onClick={del}><Trash2 className="w-3.5 h-3.5" />Delete story</Btn>
    </div>
  );
}

export default function Stories() {
  const [items, setItems] = useState([]);
  const [id, setId] = useState(null);
  const load = useCallback(async () => { const d = await list("stories"); setItems(d); setId((c) => c || d[0]?.id); }, []);
  useEffect(() => { load(); }, [load]);
  const s = items.find((x) => x.id === id);
  const save = async (patch) => { await update("stories", id, patch); load(); };
  const add = async () => {
    const n = await create("stories", { title: "New story idea", stage: "Idea", kind: "product", what_happened: "", audience: "", known_facts: [], open_questions: [], approvals: { "Product review": false, "Engineering review": false, "Customer approval": false, "Claims checked": false, "Final edit": false }, formats: [] });
    await load(); setId(n.id);
  };
  const del = async () => { await remove("stories", id); setId(null); toast.success("Story deleted"); load(); };
  return (
    <div>
      <PageHead n="03" kicker="Product & customer stories" title="Stories worth telling" accent="." sub="Find the story inside the product. Verify it. Get permission. Then decide how it should be told." />
      <section className="bg-linen text-chocolate px-5 md:px-10 pb-16">
        <div className="flex justify-between items-center mb-4"><p className="kicker text-tangelo">Pipeline</p><Btn variant="accent" data-testid="new-story-btn" onClick={add}><Plus className="w-3.5 h-3.5" />New story</Btn></div>
        <div className="overflow-x-auto scroll-thin mb-12" data-testid="story-pipeline">
          <div className="grid grid-cols-8 min-w-[1100px] border-t border-l border-chocolate/30">
            {STAGES.map((st, i) => (
              <div key={st} className="border-r border-b border-chocolate/30 min-h-[150px]">
                <p className="bg-chocolate text-linen kicker px-3 py-2"><span className="text-tangelo mr-1">{String(i + 1).padStart(2, "0")}</span>{st}</p>
                <div className="p-2 space-y-2">
                  {items.filter((x) => x.stage === st).map((x) => (
                    <button key={x.id} data-testid={`story-card-${x.id}`} onClick={() => setId(x.id)} className={`w-full text-left p-2 font-mono text-[11px] leading-snug transition-colors ${x.id === id ? "bg-tangelo text-linen" : "bg-paper border border-chocolate/30 hover:border-tangelo"}`}>{x.title}{x.illustrative && <span className="block text-[9px] opacity-70 mt-1">ILLUSTRATIVE</span>}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {s ? <StoryDetail s={s} save={save} del={del} key={s.id} /> : <Empty title="No story selected.">Create a story idea to start.</Empty>}
      </section>
    </div>
  );
}
