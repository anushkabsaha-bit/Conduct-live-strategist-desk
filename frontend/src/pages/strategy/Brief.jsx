import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, ArrowRight } from "lucide-react";
import { useStrategy, useLocalDoc, logDecision } from "../../lib/strategy";
import { StrategyTabs, Section, Loading, SaveBar } from "../../components/StrategyKit";
import { Btn } from "../../components/kit";

function Fields({ d, set }) {
  const up = (i, v) => set({ fields: d.fields.map((f, j) => (j === i ? { ...f, v } : f)) });
  return (
    <dl className="max-w-5xl" data-testid="brief-fields">
      {d.fields.map((f, i) => (
        <div key={f.k} className="grid md:grid-cols-[220px_1fr] gap-2 md:gap-6 py-3 border-b border-chocolate/20">
          <dt className="kicker text-tangelo pt-2">{f.t}</dt>
          <dd><textarea data-testid={`brief-${f.k}`} rows={2} className="w-full bg-transparent font-mono text-sm leading-relaxed border border-transparent hover:border-chocolate/20 focus:border-chocolate focus:bg-paper outline-none p-2 resize-y transition-colors" value={f.v} onChange={(e) => up(i, e.target.value)} /></dd>
        </div>
      ))}
    </dl>
  );
}

function Challenges({ d, set }) {
  const [c, setC] = useState("");
  const up = (i, response) => set({ challenges: d.challenges.map((x, j) => (j === i ? { ...x, response } : x)) });
  return (
    <div className="max-w-5xl" data-testid="brief-challenges">
      {d.challenges.map((x, i) => (
        <div key={i} className="grid md:grid-cols-2 gap-3 py-3 border-b border-chocolate/20">
          <p className="font-serifit text-xl leading-snug">{x.challenge}</p>
          <textarea data-testid={`challenge-response-${i}`} className="field !text-xs min-h-[60px]" placeholder="My answer to this challenge" value={x.response} onChange={(e) => up(i, e.target.value)} />
        </div>
      ))}
      <div className="flex gap-2 mt-3"><input data-testid="new-challenge" className="field" placeholder="Challenge the concept: what could be wrong with it?" value={c} onChange={(e) => setC(e.target.value)} /><Btn data-testid="add-challenge" onClick={() => { if (c.trim()) { set({ challenges: [...d.challenges, { challenge: c.trim(), response: "" }] }); setC(""); } }}><Plus className="w-3.5 h-3.5" />Add</Btn></div>
    </div>
  );
}

function Alternatives({ d, set }) {
  const [n, setN] = useState("");
  const up = (i, p) => set({ alternatives: d.alternatives.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <div data-testid="brief-alternatives">
      <div className="grid md:grid-cols-3 gap-0 border-l-2 border-t-2 border-linen/30">
        {d.alternatives.map((a, i) => (
          <label key={a.id} className={`border-r-2 border-b-2 border-linen/30 p-5 cursor-pointer transition-colors ${d.chosen === a.id ? "bg-linen text-chocolate" : "hover:bg-linen/5"}`} data-testid={`alt-${a.id}`}>
            <div className="flex items-center gap-2 mb-3"><input type="radio" name="alt" checked={d.chosen === a.id} onChange={() => set({ chosen: a.id })} data-testid={`alt-choose-${a.id}`} className="accent-[#d54c15]" /><span className="font-display uppercase text-xl leading-none">{a.concept}</span></div>
            <p className="kicker text-tangelo">For</p><textarea className="w-full bg-transparent font-mono text-xs outline-none resize-none" rows={2} value={a.pros} onChange={(e) => up(i, { pros: e.target.value })} />
            <p className="kicker text-tangelo mt-2">Against</p><textarea className="w-full bg-transparent font-mono text-xs outline-none resize-none" rows={2} value={a.cons} onChange={(e) => up(i, { cons: e.target.value })} />
          </label>
        ))}
      </div>
      <div className="flex gap-2 mt-3 max-w-3xl"><input data-testid="new-alternative" className="field-dark" placeholder="Record another alternative" value={n} onChange={(e) => setN(e.target.value)} /><Btn variant="lineDark" data-testid="add-alternative" onClick={() => { if (n.trim()) { set({ alternatives: [...d.alternatives, { id: `alt${Date.now()}`, concept: n.trim(), pros: "", cons: "" }] }); setN(""); } }}><Plus className="w-3.5 h-3.5" />Add</Btn></div>
      <textarea data-testid="alt-reason" className="field-dark min-h-[80px] mt-4 max-w-3xl" placeholder="Why I'd choose this direction over the others" value={d.choice_reason} onChange={(e) => set({ choice_reason: e.target.value })} />
    </div>
  );
}

export default function BriefPage() {
  const { docs, error, save, reload } = useStrategy();
  const L = useLocalDoc(docs?.brief, save, "brief");
  const d = L.d;
  if (!docs || !d) return <div><StrategyTabs /><Loading error={error} retry={reload} /></div>;
  const set = (p) => L.setD({ ...d, ...p });
  const saveAll = async () => {
    const choiceChanged = (d.chosen !== docs.brief.chosen || d.choice_reason !== docs.brief.choice_reason) && d.chosen;
    if (choiceChanged && !d.choice_reason.trim()) return toast.error("Explain why you chose this direction before saving.");
    if (!(await L.persist())) return toast.error("Couldn't save. Your edits are still here.");
    if (choiceChanged) await logDecision(docs.brief, "Campaign brief · concept", `Concept: ${d.alternatives.find((a) => a.id === d.chosen)?.concept}`, d.choice_reason);
    toast.success("Brief saved");
  };
  return (
    <div data-testid="brief-page">
      <StrategyTabs />
      <header className="bg-linen text-chocolate px-5 md:px-10 pt-12 pb-8 border-b-2 border-chocolate">
        <p className="font-mono text-[9px] tracking-[0.16em] uppercase bg-chocolate text-linen inline-block px-2 py-1 mb-5" data-testid="brief-label">{d.label}</p>
        <h1 className="font-display uppercase leading-[0.92] text-4xl sm:text-5xl lg:text-6xl">Why SAP Score <span className="text-tangelo">exists</span></h1>
        <div className="flex flex-wrap gap-6 mt-5"><Link to="/score" data-testid="brief-to-score" className="font-mono text-[11px] uppercase tracking-[0.14em] underline-grow inline-flex items-center gap-1">Play SAP Score<ArrowRight className="w-3 h-3" /></Link><Link to="/strategy/measure" data-testid="brief-to-measure" className="font-mono text-[11px] uppercase tracking-[0.14em] underline-grow inline-flex items-center gap-1">How it would be judged<ArrowRight className="w-3 h-3" /></Link></div>
      </header>
      <Section n="A" title="The brief" sub="Click any line to edit it."><Fields d={d} set={set} /></Section>
      <Section n="B" title="Challenge the concept" sub="The objections I'd expect, and my answers." tone="paper"><Challenges d={d} set={set} /></Section>
      <Section n="C" title="Alternatives" sub="SAP Score isn't the only way in. Pick one and say why." tone="ink"><Alternatives d={d} set={set} /></Section>
      <SaveBar dirty={L.dirty} busy={L.busy} onSave={saveAll} testid="brief-save" />
    </div>
  );
}
