import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ChevronDown, Lock, Unlock, Trash2 } from "lucide-react";
import { useStrategy, logDecision, scoreStats, clearScore } from "../../lib/strategy";
import { fmtDate } from "../../lib/meta";
import { StrategyTabs, Section, Loading } from "../../components/StrategyKit";
import { Btn } from "../../components/kit";
import Experiments from "../../components/Experiments";

const num = (s) => { const m = String(s || "").replace(",", ".").match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };
const TRACK = { prototype: "Counted by this prototype", external: "Needs external analytics", manual: "Logged by hand" };
const STATES = [
  { id: "continue", t: "Continue", d: "Evidence supports running another iteration.", c: "bg-[#2F7D4F]" },
  { id: "change", t: "Change", d: "Participation or audience quality shows a fixable problem.", c: "bg-botticelli !text-chocolate" },
  { id: "stop", t: "Stop", d: "The concept doesn't justify more effort, even after a fair test.", c: "bg-tangelo" },
];

function compare(m) {
  if (!String(m.actual).trim()) return { t: "No result recorded", c: "opacity-50" };
  const a = num(m.actual), th = num(m.threshold);
  if (a === null || th === null) return { t: "Recorded. Compare by hand", c: "text-chocolate" };
  return a >= th ? { t: `Meets assumption (${a} vs ${th})`, c: "text-[#2F7D4F]" } : { t: `Below assumption (${a} vs ${th})`, c: "text-tangelo" };
}

function ProtoPanel() {
  const [s, setS] = useState(null);
  const load = () => scoreStats().then(setS).catch(() => setS({ err: true }));
  useEffect(() => { load(); }, []);
  const clear = async () => { if (!window.confirm("Clear all prototype test counts? Campaign results you recorded are not affected.")) return; await clearScore(); load(); toast.success("Prototype counts cleared"); };
  if (!s) return <p className="font-mono text-xs opacity-60">Loading prototype counts</p>;
  if (s.err) return <p className="font-mono text-xs text-tangelo">Couldn't load prototype counts. <button onClick={load} className="underline">Retry</button></p>;
  const cells = [["Starts", s.start], ["Completions", s.complete], ["Completion rate", s.completion_rate === null ? "n/a" : `${s.completion_rate}%`], ["Share actions", s.shares]];
  return (
    <div className="border-2 border-linen/30 p-5" data-testid="prototype-stats">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="kicker text-botticelli">Prototype test data · not campaign results</p>
        <div className="flex gap-3"><button data-testid="refresh-stats" onClick={load} className="font-mono text-[10px] uppercase underline-grow">Refresh</button><button data-owner-only="" data-testid="clear-stats" onClick={clear} className="font-mono text-[10px] uppercase text-linen/60 hover:text-tangelo inline-flex items-center gap-1"><Trash2 className="w-3 h-3" />Clear</button></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-linen/15">
        {cells.map(([l, v]) => <div key={l} className="bg-ink p-4"><p className="font-display text-4xl leading-none" data-testid={`stat-${l.toLowerCase().replace(/ /g, "-")}`}>{v}</p><p className="kicker text-linen/50 mt-2">{l}</p></div>)}
      </div>
      <p className="font-mono text-[10px] text-linen/50 mt-3 leading-relaxed">Anonymous counts from people trying the prototype{s.since ? ` since ${fmtDate(s.since)}` : ""}. This includes my own and reviewers' test runs. No campaign has run.{Object.keys(s.by_result).length > 0 && ` Results so far: ${Object.entries(s.by_result).map(([k, v]) => `${k} (${v})`).join(", ")}.`}</p>
    </div>
  );
}

function Hypothesis({ doc, save }) {
  const [h, setH] = useState(doc.hypothesis_id || "");
  const [custom, setCustom] = useState(doc.hypothesis_custom || "");
  const submit = async () => {
    const text = h === "custom" ? custom : doc.hypotheses.find((x) => x.id === h)?.text;
    if (!text?.trim()) return toast.error("Choose or write a hypothesis.");
    await save("measure", { hypothesis_id: h, hypothesis_custom: custom });
    await logDecision(doc, "SAP Score · campaign hypothesis", "Campaign hypothesis chosen", text);
    toast.success("Hypothesis saved");
  };
  return (
    <div className="space-y-2" data-testid="hypothesis-picker">
      {[...doc.hypotheses, { id: "custom", text: "My own hypothesis" }].map((x) => (
        <label key={x.id} className={`flex gap-3 p-3 border cursor-pointer transition-colors ${h === x.id ? "border-chocolate bg-paper" : "border-chocolate/25 hover:border-chocolate"}`}>
          <input type="radio" name="hyp" checked={h === x.id} onChange={() => setH(x.id)} data-testid={`hypothesis-${x.id}`} className="accent-[#d54c15] mt-1" />
          <span className="font-mono text-xs leading-relaxed">{x.text}</span>
        </label>
      ))}
      {h === "custom" && <textarea data-testid="hypothesis-custom" className="field min-h-[60px]" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="If we..., then..., because..." />}
      <Btn data-owner-only="" data-testid="save-hypothesis" onClick={submit}>Save hypothesis</Btn>
      {doc.hypothesis_id && <p className="font-mono text-[10px] opacity-70">Saved hypothesis: {doc.hypothesis_id}</p>}
    </div>
  );
}

function MetricRow({ m, set, locked, commit }) {
  const [open, setOpen] = useState(false);
  const cmp = compare(m);
  return (
    <div className="border-b border-chocolate/25" data-testid={`metric-${m.id}`}>
      <div className="grid md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-3 py-3 items-start">
        <button onClick={() => setOpen(!open)} data-testid={`metric-toggle-${m.id}`} className="text-left flex items-start gap-2 group">
          <ChevronDown className={`w-3.5 h-3.5 mt-0.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          <span><span className="font-mono text-sm font-bold group-hover:text-tangelo">{m.name}</span><span className="block font-mono text-[9px] uppercase tracking-[0.12em] opacity-60 mt-0.5">{TRACK[m.tracking]}</span></span>
        </button>
        <input data-testid={`threshold-${m.id}`} disabled={locked} className="field !py-1.5 !text-xs disabled:opacity-60" placeholder="Planning assumption, e.g. 40%" value={m.threshold} onChange={(e) => set({ threshold: e.target.value })} onBlur={commit} />
        <input data-testid={`actual-${m.id}`} className="field !py-1.5 !text-xs" placeholder={locked ? "Actual result" : "Lock assumptions first"} disabled={!locked} value={m.actual} onChange={(e) => set({ actual: e.target.value, actual_at: new Date().toISOString() })} onBlur={commit} />
        <p className={`font-mono text-[11px] pt-1.5 ${cmp.c}`} data-testid={`compare-${m.id}`}>{cmp.t}</p>
      </div>
      {open && (
        <div className="grid md:grid-cols-5 gap-4 pb-4 pl-6 animate-rise font-mono text-[11px] leading-relaxed">
          {[["Why it matters", m.why], ["How it's measured", m.how], ["Baseline needed", m.baseline], ["Signals", `Positive: ${m.positive}\nNegative: ${m.negative}`], ["Decision that could follow", m.decision]].map(([l, v]) => <div key={l}><p className="kicker text-tangelo mb-1">{l}</p><p className="whitespace-pre-line">{v}</p></div>)}
          <div className="md:col-span-5 grid md:grid-cols-2 gap-3">
            <input data-testid={`threshold-note-${m.id}`} disabled={locked} className="field !py-1.5 !text-xs" placeholder="Why this assumption?" value={m.threshold_note} onChange={(e) => set({ threshold_note: e.target.value })} onBlur={commit} />
            <input data-testid={`actual-note-${m.id}`} disabled={!locked} className="field !py-1.5 !text-xs" placeholder="Where the result came from" value={m.actual_note} onChange={(e) => set({ actual_note: e.target.value })} onBlur={commit} />
          </div>
        </div>
      )}
    </div>
  );
}

function Metrics({ doc, save }) {
  const [ms, setMs] = useState(doc.metrics);
  const [busy, setBusy] = useState(false);
  useEffect(() => setMs(doc.metrics), [doc.metrics]);
  const dirty = JSON.stringify(ms) !== JSON.stringify(doc.metrics);
  const latest = useRef(ms);
  latest.current = ms;
  const commit = () => setTimeout(() => { if (JSON.stringify(latest.current) !== JSON.stringify(doc.metrics)) save("measure", { metrics: latest.current }).catch(() => toast.error("Could not save. Your edits are still here.")); }, 0);
  const locked = !!doc.locked_at;
  const persist = async () => { setBusy(true); try { await save("measure", { metrics: ms }); toast.success("Plan saved"); } catch { toast.error("Could not save. Your edits are still here."); } finally { setBusy(false); } };
  const lock = async () => {
    if (dirty) await save("measure", { metrics: ms });
    const set = ms.filter((m) => m.threshold.trim()).length;
    await save("measure", { locked_at: locked ? "" : new Date().toISOString() });
    await logDecision(doc, "SAP Score · measurement plan", locked ? "Assumptions unlocked for revision" : "Assumptions locked before launch", `${set} of ${ms.length} metrics have a planning threshold.`);
    toast.success(locked ? "Assumptions unlocked. This change is recorded." : "Assumptions locked. You can now record actual results.");
  };
  const areas = [...new Set(ms.map((m) => m.area))];
  return (
    <div data-testid="metrics-plan">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 ${locked ? "bg-chocolate text-linen" : "border border-chocolate"}`} data-testid="plan-status">{locked ? `Assumptions locked ${fmtDate(doc.locked_at)}` : "Planning: thresholds are assumptions, not benchmarks"}</span>
        <Btn data-owner-only="" data-testid="save-plan" onClick={persist} loading={busy} disabled={!dirty}>{dirty ? "Save plan" : "Saved"}</Btn>
        <Btn data-owner-only="" data-testid="lock-plan" variant="line" onClick={lock}>{locked ? <><Unlock className="w-3.5 h-3.5" />Unlock to revise</> : <><Lock className="w-3.5 h-3.5" />Lock before launch</>}</Btn>
      </div>
      <div className="hidden md:grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-3 kicker opacity-60 pb-2 border-b-2 border-chocolate"><span>Metric</span><span>Proposed threshold</span><span>Actual result</span><span>Against assumption</span></div>
      {areas.map((a) => (
        <div key={a}><p className="font-display uppercase text-xl pt-5 pb-1">{a}</p>
          {ms.map((m, i) => m.area === a && <MetricRow key={m.id} m={m} locked={locked} commit={commit} set={(p) => setMs(ms.map((x, j) => (j === i ? { ...x, ...p } : x)))} />)}
        </div>
      ))}
    </div>
  );
}

function Decide({ doc, save }) {
  const [st, setSt] = useState("");
  const [why, setWhy] = useState("");
  const hasResults = doc.metrics.some((m) => String(m.actual).trim());
  const submit = async () => {
    if (!st || !why.trim()) return toast.error("Choose continue, change or stop, and give your reasoning.");
    const entry = { state: st, reasoning: why, at: new Date().toISOString(), had_results: hasResults };
    await save("measure", { decision_history: [entry, ...(doc.decision_history || [])] });
    await logDecision(doc, "SAP Score · campaign decision", `${STATES.find((x) => x.id === st).t}${hasResults ? "" : " (before results)"}`, why);
    setWhy(""); toast.success("Decision recorded");
  };
  return (
    <div data-testid="decision-panel">
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        {STATES.map((s) => <button key={s.id} data-owner-only="" data-testid={`decision-${s.id}`} onClick={() => setSt(s.id)} className={`text-left p-5 border-2 transition-[transform,background-color] duration-200 ${st === s.id ? `${s.c} text-linen border-transparent -translate-y-1` : "border-linen/30 hover:border-linen"}`}><p className="font-display uppercase text-3xl leading-none">{s.t}</p><p className="font-mono text-[11px] mt-2 leading-relaxed">{s.d}</p></button>)}
      </div>
      {!hasResults && <p className="font-mono text-[11px] text-botticelli mb-2">No actual results recorded yet. A decision now is a pre-launch judgement, and will be labelled that way.</p>}
      <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end"><textarea data-testid="decision-reasoning" className="field-dark min-h-[80px]" placeholder="What evidence is this based on? What would change your mind?" value={why} onChange={(e) => setWhy(e.target.value)} /><Btn variant="accent" data-owner-only="" data-testid="save-decision" onClick={submit}>Record decision</Btn></div>
      <div className="mt-6" data-testid="decision-history">
        {(doc.decision_history || []).map((d, i) => <div key={i} className="py-2 border-b border-linen/15 font-mono text-xs"><span className="kicker text-tangelo mr-2">{fmtDate(d.at)} · {d.state}{d.had_results ? "" : " · before results"}</span>{d.reasoning}</div>)}
      </div>
    </div>
  );
}

function Failure({ doc, save }) {
  const [notes, setNotes] = useState(doc.failure_notes || "");
  return (
    <div data-testid="failure-analysis">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-chocolate/30">
        {doc.failure.map((f, i) => <div key={i} className="border-r border-b border-chocolate/30 p-5"><p className="font-mono text-sm font-bold mb-2">If: {f.pattern}</p><p className="font-mono text-[11px] leading-relaxed"><span className="kicker text-tangelo">Possible reading (hypothesis) </span>{f.reading}</p><p className="font-mono text-[11px] leading-relaxed mt-2"><span className="kicker text-tangelo">Investigate </span>{f.investigate}</p></div>)}
      </div>
      <textarea data-testid="failure-notes" className="field min-h-[80px] mt-4 max-w-3xl" placeholder="My notes on what actually happened, once there is evidence" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Btn data-owner-only="" data-testid="save-failure-notes" className="mt-2" disabled={notes === (doc.failure_notes || "")} onClick={async () => { await save("measure", { failure_notes: notes }); toast.success("Notes saved"); }}>Save notes</Btn>
    </div>
  );
}

export default function MeasurePage() {
  const { docs, error, save, reload } = useStrategy();
  const doc = docs?.measure;
  return (
    <div data-testid="measure-page">
      <StrategyTabs />
      {!doc ? <Loading error={error} retry={reload} /> : (<>
        <header className="bg-ink text-linen px-5 md:px-10 pt-12 pb-10 border-b border-linen/15">
          <p className="kicker text-botticelli mb-4">05 · Did it work? · decide before the results arrive</p>
          <h1 className="font-display uppercase leading-[0.92] text-4xl sm:text-5xl lg:text-6xl max-w-5xl">What would <span className="text-tangelo">change my mind?</span></h1>
          <p className="font-mono text-xs mt-5 max-w-2xl leading-relaxed text-linen/75">{doc.objective} No campaign has run. Thresholds are my planning assumptions, not industry benchmarks.</p>
          <div className="mt-8"><ProtoPanel /></div>
        </header>
        <Section n="A" title="Campaign hypothesis" sub="What I'm actually testing. Pick one before setting thresholds."><div className="max-w-3xl"><Hypothesis doc={doc} save={save} /></div></Section>
        <Section n="B" title="Experiments" sub="Plan it, say what would change my mind, run it, then compare." tone="paper"><div className="max-w-6xl"><Experiments doc={doc} save={save} /></div></Section>
        <Section n="C" title="Metrics, thresholds and results" sub="Set assumptions, lock them before launch, record what happened."><Metrics doc={doc} save={save} /></Section>
        <Section n="D" title="Failure analysis" sub="Patterns to watch for. Each reading is a hypothesis to investigate." tone="paper"><Failure doc={doc} save={save} /></Section>
        <Section n="E" title="Continue, change or stop" sub="My decision, with the reasoning on record." tone="ink"><Decide doc={doc} save={save} /></Section>
        <div className="bg-linen px-5 md:px-10 py-8 flex flex-wrap gap-6"><Link to="/" data-testid="measure-to-overview" className="font-mono text-[11px] uppercase tracking-[0.14em] text-chocolate underline-grow inline-flex items-center gap-2">Back to the start<ArrowRight className="w-3 h-3" /></Link><Link to="/score" data-testid="measure-to-score" className="font-mono text-[11px] uppercase tracking-[0.14em] text-chocolate underline-grow">Try SAP Score</Link></div>
      </>)}
    </div>
  );
}
