import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, ChevronDown } from "lucide-react";
import { logDecision } from "../lib/strategy";
import { fmtDate } from "../lib/meta";
import { Btn } from "./kit";

const num = (s) => { const m = String(s || "").replace(",", ".").match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };
const PLAN = [["hypothesis", "Hypothesis", 2], ["audience", "Audience", 1], ["baseline", "Baseline, or information still needed", 1], ["threshold", "Proposed success threshold (planning assumption)", 1], ["period", "Observation period", 1], ["metric", "Metric", 1], ["source", "Metric source", 1]];
const STAGE = { planning: "Planning", ready: "Ready to run", results: "Result recorded", decided: "Decided" };
const DEC = [["continue", "Continue", "Evidence supports another iteration."], ["change", "Change", "Shows potential, but one part needs improving."], ["stop", "Stop", "Not enough relevant value to justify more effort."]];
const blank = (hyp) => ({ id: `exp${Date.now()}`, name: "", is_test: false, hypothesis: hyp || "", audience: "", baseline: "", threshold: "", period: "", metric: "", source: "", change_my_mind: "", status: "planning", result: "", result_note: "", view_changed: "", decision: "", decision_reason: "", log: [] });

function Verdict({ e, i }) {
  const a = num(e.result), t = num(e.threshold);
  const v = a === null || t === null ? "Compare by hand: the threshold or result isn't a single number." : a >= t ? `Meets the planning threshold (${a} vs ${t}).` : `Below the planning threshold (${a} vs ${t}).`;
  return (
    <div className="grid md:grid-cols-3 gap-0 border-2 border-chocolate" data-testid={`exp-compare-${i}`}>
      <div className="p-3 md:border-r-2 border-chocolate"><p className="kicker text-tangelo mb-1">What I expected</p><p className="font-mono text-xs">{e.hypothesis}</p><p className="font-mono text-[11px] mt-1 opacity-70">Threshold: {e.threshold || "none set"}</p></div>
      <div className="p-3 md:border-r-2 border-chocolate"><p className="kicker text-tangelo mb-1">What happened</p><p className="font-mono text-xs">{e.result}</p><p className="font-mono text-[11px] mt-1 opacity-70">{e.result_note}</p></div>
      <div className="p-3 bg-paper"><p className="kicker text-tangelo mb-1">Against the assumption</p><p className="font-mono text-xs" data-testid={`exp-verdict-${i}`}>{v}</p><p className="font-mono text-[11px] mt-1 opacity-70">What I said would change my mind: {e.change_my_mind}</p></div>
    </div>
  );
}

function Experiment({ e, i, persist, doc }) {
  const [x, setX] = useState(e);
  const [open, setOpen] = useState(e.status !== "decided");
  const s = (k) => (ev) => setX({ ...x, [k]: ev.target.type === "checkbox" ? ev.target.checked : ev.target.value });
  const commit = (patch, msg, logLine) => { const n = { ...x, ...patch, log: [...(x.log || []), ...(logLine ? [{ at: new Date().toISOString(), t: logLine }] : [])] }; setX(n); return persist(i, n, msg); };
  const planning = x.status === "planning";
  return (
    <div className="border-2 border-chocolate mb-4" data-testid={`experiment-${i}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex flex-wrap items-center gap-3 px-4 py-3 bg-paper text-left" data-testid={`exp-toggle-${i}`}>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        <span className="font-display uppercase text-xl flex-1">{x.name || "Untitled experiment"}</span>
        {x.is_test && <span className="font-mono text-[9px] uppercase tracking-[0.14em] bg-botticelli px-1.5 py-0.5" data-testid={`exp-test-label-${i}`}>Test entry · hypothetical</span>}
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] bg-chocolate text-linen px-1.5 py-0.5" data-testid={`exp-status-${i}`}>{STAGE[x.status]}{x.decision ? `: ${x.decision}` : ""}</span>
      </button>
      {open && <div className="p-4 space-y-4 bg-linen">
        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-center"><input data-testid={`exp-name-${i}`} disabled={!planning} className="field" placeholder="Experiment name" value={x.name} onChange={s("name")} /><label className="font-mono text-[11px] uppercase flex items-center gap-2"><input type="checkbox" data-testid={`exp-is-test-${i}`} disabled={!planning} checked={x.is_test} onChange={s("is_test")} className="accent-[#d54c15]" />Test entry (hypothetical)</label></div>
        <div className="grid md:grid-cols-2 gap-3">{PLAN.map(([k, l, r]) => <label key={k} className={r === 2 ? "md:col-span-2" : ""}><span className="kicker opacity-70">{l}</span><textarea data-testid={`exp-${k}-${i}`} disabled={!planning} rows={r} className="field !text-xs mt-1 disabled:opacity-70" value={x[k]} onChange={s(k)} /></label>)}</div>
        <label className="block border-l-4 border-tangelo pl-3"><span className="kicker text-tangelo">What result would make me change my mind? (required before running)</span><textarea data-testid={`exp-change-mind-${i}`} disabled={!planning} rows={2} className="field !text-xs mt-1" value={x.change_my_mind} onChange={s("change_my_mind")} /></label>
        {planning && <div className="flex flex-wrap gap-2">
          <Btn variant="line" data-owner-only="" data-testid={`exp-save-${i}`} onClick={() => commit({}, "Experiment saved")}>Save plan</Btn>
          <Btn data-owner-only="" data-testid={`exp-ready-${i}`} disabled={!x.change_my_mind.trim() || !x.hypothesis.trim()} onClick={() => commit({ status: "ready" }, "Marked ready to run. The plan is now fixed.", "Marked ready to run")}>Mark ready to run</Btn>
          {!x.change_my_mind.trim() && <span className="font-mono text-[10px] text-tangelo self-center">Answer the change-my-mind question first.</span>}
        </div>}
        {x.status === "ready" && <div className="space-y-2 border-t-2 border-chocolate pt-4">
          <p className="kicker text-tangelo">Record the result{x.is_test ? " (test entry, not real data)" : ""}</p>
          <div className="grid md:grid-cols-2 gap-2"><input data-testid={`exp-result-${i}`} className="field" placeholder="Observed result, e.g. 31%" value={x.result} onChange={s("result")} /><input data-testid={`exp-result-note-${i}`} className="field" placeholder="Where it came from and over what period" value={x.result_note} onChange={s("result_note")} /></div>
          <div className="flex gap-2"><Btn data-owner-only="" data-testid={`exp-record-${i}`} disabled={!x.result.trim()} onClick={() => commit({ status: "results", result_at: new Date().toISOString() }, "Result recorded", `Result recorded: ${x.result}`)}>Record result</Btn><Btn variant="line" data-owner-only="" data-testid={`exp-revise-${i}`} onClick={() => commit({ status: "planning" }, "Back to planning. This is logged.", "Plan reopened before results")}>Revise plan</Btn></div>
        </div>}
        {(x.status === "results" || x.status === "decided") && <div className="space-y-3 border-t-2 border-chocolate pt-4">
          <Verdict e={x} i={i} />
          <label className="block"><span className="kicker opacity-70">Did the evidence change my view? How?</span><textarea data-testid={`exp-view-${i}`} rows={2} className="field !text-xs mt-1" value={x.view_changed} onChange={s("view_changed")} /></label>
          <div className="grid md:grid-cols-3 gap-2">{DEC.map(([k, t, dsc]) => <button key={k} data-owner-only="" data-testid={`exp-decision-${k}-${i}`} onClick={() => setX({ ...x, decision: k })} className={`text-left p-3 border-2 transition-colors ${x.decision === k ? "bg-chocolate text-linen border-chocolate" : "border-chocolate/30 hover:border-chocolate"}`}><p className="font-display uppercase text-2xl leading-none">{t}</p><p className="font-mono text-[10px] mt-1">{dsc}</p></button>)}</div>
          <textarea data-testid={`exp-decision-reason-${i}`} rows={2} className="field !text-xs" placeholder="My reasoning" value={x.decision_reason} onChange={s("decision_reason")} />
          <Btn variant="accent" data-owner-only="" data-testid={`exp-decide-${i}`} disabled={!x.decision || !x.decision_reason.trim() || !x.view_changed.trim()} onClick={async () => { await commit({ status: "decided" }, "Decision recorded", `Decision: ${x.decision}`); await logDecision(doc, `Did it work? · ${x.name || "experiment"}${x.is_test ? " (TEST ENTRY)" : ""}`, `${x.decision}: ${x.result}`, `${x.decision_reason} | View changed: ${x.view_changed}`); }}>Record decision</Btn>
        </div>}
        {(x.log || []).length > 0 && <div className="font-mono text-[10px] opacity-70" data-testid={`exp-log-${i}`}>{x.log.map((l, k) => <p key={k}>{fmtDate(l.at)} · {l.t}</p>)}</div>}
      </div>}
    </div>
  );
}

export default function Experiments({ doc, save }) {
  const exps = doc.experiments || [];
  const hyp = doc.hypothesis_id === "custom" ? doc.hypothesis_custom : doc.hypotheses.find((h) => h.id === doc.hypothesis_id)?.text;
  const persist = async (i, e, msg) => {
    try { await save("measure", { experiments: exps.map((x, j) => (j === i ? e : x)) }); toast.success(msg); }
    catch { toast.error("Couldn't save the experiment."); }
  };
  return (
    <div data-testid="experiments">
      {exps.map((e, i) => <Experiment key={e.id} e={e} i={i} persist={persist} doc={doc} />)}
      {!exps.length && <p className="font-mono text-xs opacity-60 mb-4">No experiments yet. Nothing has been run.</p>}
      <Btn data-owner-only="" data-testid="add-experiment" onClick={() => save("measure", { experiments: [...exps, blank(hyp)] })}><Plus className="w-3.5 h-3.5" />New experiment</Btn>
      <div className="mt-8 border-t-2 border-chocolate pt-4" data-testid="scenarios">
        <p className="kicker text-tangelo mb-3">How I'd read a few patterns · illustrative, not data</p>
        {(doc.scenarios || []).map((s, i) => <div key={i} className="grid md:grid-cols-[1fr_1.3fr] gap-3 py-2 border-b border-chocolate/15 font-mono text-xs"><p className="font-bold">If {s.pattern.charAt(0).toLowerCase() + s.pattern.slice(1)}</p><p>{s.reading}</p></div>)}
        <p className="font-mono text-[10px] opacity-60 mt-2">Possible interpretations to investigate, never automatic conclusions.</p>
      </div>
    </div>
  );
}
