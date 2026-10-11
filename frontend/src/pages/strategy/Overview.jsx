import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Check, Circle } from "lucide-react";
import { list } from "../../lib/api";
import { useStrategy } from "../../lib/strategy";
import { StrategyTabs, Section, Expand, Loading } from "../../components/StrategyKit";
import { Btn } from "../../components/kit";

function Chain({ n, d, m }) {
  const steps = [
    { k: "01", to: "/strategy/narrative", kind: "Strategy document", t: "The problem", body: "Conduct's public work on keeping SAP process documentation connected to reality, translated for three audiences.", state: n.preferred_draft ? "Preferred direction chosen" : "Direction not chosen yet", tone: "bg-linen text-chocolate" },
    { k: "02", to: "/score", kind: "Playable prototype", t: "The experiment", body: "SAP Score turns the problem into a one-minute prompt people might recognise themselves in, and share.", state: "Playable · not a live campaign", tone: "bg-chocolate text-linen" },
    { k: "03", to: "/strategy/measure", kind: "Measurement instrument", t: "The decision", body: "Planned metrics, editable thresholds and a recorded call to continue, change or stop.", state: m.decision_history?.length ? `Last decision: ${m.decision_history[0].state}` : "No decision recorded", tone: "bg-ink text-linen border border-linen/25" },
  ];
  return (
    <div className="grid lg:grid-cols-3 gap-0" data-testid="strategy-chain">
      {steps.map((s, i) => (
        <Link key={s.k} to={s.to} data-testid={`chain-${s.k}`} className={`${s.tone} p-6 md:p-8 group relative transition-transform duration-300 hover:-translate-y-1 animate-rise`} style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-center justify-between mb-10"><span className="font-mono text-xs text-tangelo">{s.k}</span><span className="kicker opacity-60">{s.kind}</span></div>
          <p className="font-display uppercase text-4xl md:text-5xl leading-none mb-4">{s.t}</p>
          <p className="font-mono text-xs leading-relaxed opacity-80 mb-6 max-w-sm">{s.body}</p>
          <div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.12em] opacity-70">{s.state}</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-tangelo" /></div>
        </Link>
      ))}
    </div>
  );
}

function MyCalls({ n, m, edited }) {
  const checks = Object.values(n.claim_checks || {}).filter((x) => x.checked).length;
  const thresholds = m.metrics.filter((x) => x.threshold.trim()).length;
  const items = [
    ["Chose the audience that matters most", !!n.priority_audience, "/strategy/narrative#audiences"],
    ["Compared the three directions and picked one", !!n.preferred_draft, "/strategy/narrative#drafts"],
    ["Edited a draft (saved as a new version)", edited > 0, "/strategy/narrative#drafts", `${edited} edited`],
    ["Checked claims against sources", checks > 0, "/strategy/narrative#drafts", `${checks} checked`],
    ["Recorded questions for Conduct", (n.questions || []).length > 0, "/strategy/narrative#questions", `${(n.questions || []).length} open`],
    ["Chose the campaign hypothesis", !!m.hypothesis_id, "/strategy/measure"],
    ["Set proposed success thresholds", thresholds > 0, "/strategy/measure", `${thresholds}/${m.metrics.length}`],
    ["Decided to continue, change or stop", (m.decision_history || []).length > 0, "/strategy/measure"],
  ];
  return (
    <ol className="grid md:grid-cols-2 gap-x-10" data-testid="strategist-calls">
      {items.map(([t, done, to, extra], i) => (
        <li key={t}><Link to={to} data-testid={`call-${i}`} className="flex items-center gap-3 py-3 border-b border-chocolate/20 hover:text-tangelo transition-colors">
          {done ? <Check className="w-4 h-4 text-[#2F7D4F]" /> : <Circle className="w-4 h-4 opacity-30" />}
          <span className="font-mono text-sm flex-1">{t}</span>{extra && <span className="font-mono text-[10px] opacity-60">{extra}</span>}
        </Link></li>
      ))}
    </ol>
  );
}

function ScoreEditor({ cfg, save }) {
  const [c, setC] = useState(cfg);
  useEffect(() => setC(cfg), [cfg]);
  const dirty = JSON.stringify(c) !== JSON.stringify(cfg);
  const setQ = (qi, p) => setC({ ...c, questions: c.questions.map((q, i) => (i === qi ? { ...q, ...p } : q)) });
  const setO = (qi, oi, p) => setQ(qi, { options: c.questions[qi].options.map((o, i) => (i === oi ? { ...o, ...p } : o)) });
  const setR = (ri, p) => setC({ ...c, results: c.results.map((r, i) => (i === ri ? { ...r, ...p } : r)) });
  const max = c.questions.reduce((s, q) => s + Math.max(...q.options.map((o) => +o.points || 0)), 0);
  return (
    <div className="space-y-6" data-testid="score-editor">
      {c.questions.map((q, qi) => (
        <div key={q.id} className="border-l-2 border-chocolate pl-4">
          <input data-testid={`edit-q-${qi}`} className="field !font-serifit !text-lg mb-2" value={q.q} onChange={(e) => setQ(qi, { q: e.target.value })} />
          {q.options.map((o, oi) => <div key={oi} className="grid grid-cols-[1fr_80px] gap-2 mb-1"><input data-testid={`edit-o-${qi}-${oi}`} className="field !py-1 !text-xs" value={o.label} onChange={(e) => setO(qi, oi, { label: e.target.value })} /><input type="number" data-testid={`edit-p-${qi}-${oi}`} className="field !py-1 !text-xs" value={o.points} onChange={(e) => setO(qi, oi, { points: +e.target.value })} /></div>)}
        </div>
      ))}
      <p className="font-mono text-[10px] opacity-70">Highest possible total: {max}. Scores are clamped to 0 to 100. Result bands are matched by score range.</p>
      {c.results.map((r, ri) => (
        <div key={ri} className="grid md:grid-cols-[70px_70px_1fr_1.5fr] gap-2">
          <input type="number" className="field !py-1 !text-xs" value={r.min} onChange={(e) => setR(ri, { min: +e.target.value })} aria-label="min" />
          <input type="number" className="field !py-1 !text-xs" value={r.max} onChange={(e) => setR(ri, { max: +e.target.value })} aria-label="max" />
          <input data-testid={`edit-r-title-${ri}`} className="field !py-1 !text-xs" value={r.title} onChange={(e) => setR(ri, { title: e.target.value })} />
          <input className="field !py-1 !text-xs" value={r.line} onChange={(e) => setR(ri, { line: e.target.value })} />
        </div>
      ))}
      <Btn data-testid="save-score-config" disabled={!dirty} onClick={async () => { const { id, created_at, updated_at, ...rest } = c; await save("score_config", rest); toast.success("SAP Score content saved"); }}>Save SAP Score content</Btn>
    </div>
  );
}

export default function StrategyOverview() {
  const { docs, error, save, reload } = useStrategy();
  const [edited, setEdited] = useState(0);
  const ids = docs?.narrative?.draft_ids;
  useEffect(() => { if (ids) list("drafts").then((all) => setEdited(all.filter((d) => ids.includes(d.id) && d.versions.length > 1).length)); }, [ids?.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!docs) return <div><StrategyTabs /><Loading error={error} retry={reload} /></div>;
  const { narrative: n, measure: m, score_config: cfg } = docs;
  return (
    <div data-testid="strategy-overview">
      <StrategyTabs />
      <header className="bg-linen text-chocolate px-5 md:px-10 pt-12 md:pt-16 pb-10">
        <p className="kicker text-tangelo mb-4">Launch strategy · independent portfolio work</p>
        <h1 className="font-display uppercase leading-[0.92] text-4xl sm:text-5xl lg:text-6xl max-w-5xl">A story, an experiment, <span className="text-tangelo">a decision.</span></h1>
        <p className="font-serifit italic text-xl mt-5 max-w-2xl">How I'd turn Conduct's public work on SAP process documentation into a narrative, test it with a playable campaign, and judge honestly whether the campaign is worth continuing.</p>
        <p className="font-mono text-[10px] mt-5 opacity-60 max-w-2xl">Built only from public Conduct sources. Not commissioned, reviewed or approved by Conduct. No campaign has run; nothing here reports real results.</p>
      </header>
      <div className="bg-ink px-5 md:px-10 py-10"><Chain n={n} d={null} m={m} /></div>
      <Section n="A" title="My calls" sub="The decisions only I make. Agents can review drafts in Content Desk; none of these are automated.">
        <MyCalls n={n} m={m} edited={edited} />
      </Section>
      <Section n="B" title="SAP Score content" sub="Questions, points and result bands. Edits apply to the playable prototype straight away." tone="paper">
        <div className="max-w-4xl"><Expand title="Edit questions and results" testid="toggle-score-editor"><ScoreEditor cfg={cfg} save={save} /></Expand><p className="font-mono text-[10px] opacity-60 mt-2">{cfg.provenance}</p></div>
      </Section>
    </div>
  );
}
