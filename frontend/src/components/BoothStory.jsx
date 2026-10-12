import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useStrategy } from "../lib/strategy";
import { useMode } from "../lib/mode";
import { Cite } from "./StrategyKit";

const CH = [["why", "Why this idea"], ["journey", "Visitor journey"], ["recruit", "Recruitment branch"], ["commercial", "Commercial logic"], ["execution", "Execution"], ["measure", "Measurement"], ["decisions", "My decisions"], ["next", "What I'd decide next"]];

const Chapter = ({ id, n, title, children, dark }) => (
  <section id={`booth-${id}`} data-testid={`booth-chapter-${id}`} className={`scroll-mt-32 px-5 md:px-8 py-10 border-b-2 border-chocolate ${dark ? "bg-chocolate text-linen" : ""}`}>
    <div className="flex items-baseline gap-3 mb-6"><span className="font-mono text-xs text-tangelo">{String(n).padStart(2, "0")}</span><h3 className="font-display uppercase text-3xl md:text-4xl leading-none">{title}</h3></div>
    {children}
  </section>
);

export const Polaroid = ({ score = 34, line = "Your integration layer is held together by a 15-year-old Excel macro and the memory of someone who left in 2019.", className = "" }) => (
  <figure className={`bg-[#FFFDF6] text-chocolate p-3 pb-4 w-[260px] shadow-[6px_8px_0_rgba(43,31,24,0.25)] ${className}`} data-testid="booth-polaroid">
    <div className="bg-ink aspect-square relative overflow-hidden flex items-end p-4">
      <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 40% 35%, #b9c7d9 0, transparent 55%)" }} />
      <span className="relative font-display text-linen leading-none text-6xl">{score}<span className="text-2xl text-tangelo">%</span></span>
    </div>
    <figcaption className="mt-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-tangelo">SAP Score</p>
      <p className="font-hand text-[22px] leading-[1.05] mt-1">{line}</p>
      <div className="flex items-end justify-between mt-3 pt-2 border-t border-chocolate/20">
        <div><p className="font-display uppercase text-sm leading-none">conduct<span className="text-tangelo">/</span></p><p className="font-mono text-[8px] mt-1 opacity-70 max-w-[150px]">AI operating system for enterprise software</p></div>
        <div className="w-10 h-10 border-2 border-chocolate grid grid-cols-3 gap-px p-0.5" aria-label="QR placeholder">{[1, 0, 1, 0, 1, 0, 1, 1, 0].map((x, i) => <span key={i} className={x ? "bg-chocolate" : ""} />)}</div>
      </div>
      <p className="font-mono text-[7px] mt-2 opacity-60">For fun. Not an assessment of your systems.</p>
    </figcaption>
  </figure>
);

function Why({ s, sources }) {
  return (<>
    <div className="grid lg:grid-cols-2 gap-8 mb-8">
      <div><p className="kicker text-tangelo mb-2">The observation · working assumption</p><p className="font-mono text-sm leading-relaxed">{s.observation}</p></div>
      <div><p className="kicker text-tangelo mb-2">The communications problem</p><p className="font-serifit text-2xl leading-snug">{s.problem}</p></div>
    </div>
    <p className="kicker text-tangelo mb-3">The creative decision: a Polaroid-style photo booth</p>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-l-2 border-t-2 border-chocolate mb-8">{s.elements.map((e, i) => <div key={i} className="border-r-2 border-b-2 border-chocolate p-4"><p className="font-mono text-sm font-bold mb-1">{e.t}</p><p className="font-mono text-xs leading-relaxed opacity-85">{e.why}</p></div>)}</div>
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 mb-8">
      <div><p className="kicker text-tangelo mb-2">Why the score?</p><p className="font-mono text-sm leading-relaxed">{s.score}</p></div>
      <div><p className="kicker text-tangelo mb-2">Why Conduct? Three places the joke connects to the company</p>
        {s.conduct.map((c, i) => <div key={i} className="py-2 border-b border-chocolate/20"><p className="font-mono text-xs"><b>{c.where}.</b> {c.how} <Cite ids={[c.src]} sources={sources} /></p><p className="font-mono text-[10px] text-tangelo mt-1">{c.approval}</p></div>)}</div>
    </div>
    <p className="kicker text-tangelo mb-3">Why this is more than a gimmick</p>
    <div className="grid md:grid-cols-4 gap-2" data-testid="booth-chain">{s.chain.map((c, i) => <div key={i} className="bg-paper p-3"><p className="font-display uppercase text-xl leading-none mb-2">{c.step}</p><p className="font-mono text-[11px]"><span className="kicker">Intended · </span>{c.intended}</p><p className="font-mono text-[11px] mt-1 opacity-70"><span className="kicker">Untested · </span>{c.untested}</p></div>)}</div>
  </>);
}

function Journey({ j }) {
  const [a, setA] = useState("A");
  const st = j.find((x) => x.id === a);
  return (<>
    <div className="flex flex-wrap gap-0 border-2 border-chocolate mb-6" role="tablist">{j.map((x) => <button key={x.id} data-testid={`journey-tab-${x.id}`} onClick={() => setA(x.id)} className={`flex-1 min-w-[110px] px-3 py-3 text-left border-r-2 last:border-r-0 border-chocolate transition-colors ${a === x.id ? "bg-chocolate text-linen" : "hover:bg-paper"}`}><span className="font-mono text-[10px] text-tangelo">{x.id}</span><span className="block font-display uppercase text-lg leading-none">{x.t}</span></button>)}</div>
    <div className="grid lg:grid-cols-[1.4fr_auto] gap-8 animate-rise" key={a} data-testid={`journey-stage-${a}`}>
      <div className="space-y-4">
        <p className="font-serifit text-2xl leading-snug">{st.what}</p>
        {st.show.map((x, i) => <p key={i} className="font-mono text-xs"><span className="kicker text-tangelo">{x.k} · </span>{x.v}</p>)}
        {st.why && <p className="font-mono text-xs"><span className="kicker text-tangelo">Why it might work · </span>{st.why}</p>}
        {st.safeguards && <p className="font-mono text-xs border-l-4 border-tangelo pl-3"><span className="kicker">Safeguards · </span>{st.safeguards}</p>}
        {st.steps && <div className="overflow-x-auto"><table className="w-full font-mono text-[11px]" data-testid="followthrough-table"><thead><tr className="kicker text-left">{["Step", "Owner", "Timing", "Approvals", "Information needed"].map((h) => <th key={h} className="py-2 pr-3 border-b-2 border-chocolate">{h}</th>)}</tr></thead><tbody>{st.steps.map((r, i) => <tr key={i} className="border-b border-chocolate/20 align-top">{[r.step, r.owner, r.timing, r.approvals, r.info].map((v, k) => <td key={k} className={`py-2 pr-3 ${k === 0 ? "font-bold" : ""}`}>{v}</td>)}</tr>)}</tbody></table></div>}
      </div>
      {(a === "B" || a === "D") && <div><Polaroid className={a === "B" ? "-rotate-2" : "rotate-2"} /><p className="font-mono text-[9px] uppercase tracking-[0.14em] mt-3 opacity-60">Illustrative sample card</p></div>}
    </div>
  </>);
}

function Recruit({ r }) {
  return (<>
    <p className="font-mono text-[9px] tracking-[0.14em] uppercase bg-tangelo text-linen inline-block px-2 py-1 mb-6" data-testid="recruit-label">{r.label}</p>
    <ol className="grid md:grid-cols-5 gap-2 mb-8" data-testid="recruit-steps">{r.steps.map((x, i) => <li key={i} className="bg-paper p-4 relative"><span className="font-mono text-[10px] text-tangelo">{i + 1}</span><p className="font-mono text-sm font-bold my-1">{x.t}</p><p className="font-mono text-[11px] leading-relaxed">{x.v}</p>{i < r.steps.length - 1 && <ArrowRight className="hidden md:block absolute -right-3 top-1/2 w-4 h-4 text-tangelo z-10" />}</li>)}</ol>
    <div className="grid md:grid-cols-2 gap-8">
      <div><p className="kicker text-tangelo mb-2">Potential value</p>{r.value.map((v, i) => <p key={i} className="font-mono text-xs py-1 border-b border-chocolate/15">{v}</p>)}</div>
      <div><p className="kicker text-tangelo mb-2">Fairness safeguards</p>{r.safeguards.map((v, i) => <p key={i} className="font-mono text-xs py-1 border-b border-chocolate/15">{v}</p>)}<p className="font-mono text-[10px] mt-2 text-tangelo">{r.needs}</p></div>
    </div>
  </>);
}

function Commercial({ c }) {
  return (<>
    <div className="flex flex-wrap items-center gap-1.5 mb-4" data-testid="commercial-chain">{c.chain.map((x, i) => <React.Fragment key={i}><span className={`font-mono text-[11px] px-2.5 py-1.5 ${i === c.chain.length - 1 ? "bg-tangelo text-linen" : "border border-chocolate"}`}>{x}</span>{i < c.chain.length - 1 && <ArrowRight className="w-3 h-3 text-tangelo" />}</React.Fragment>)}</div>
    <p className="font-serifit text-xl leading-snug max-w-3xl mb-2">{c.point}</p>
    <p className="font-mono text-xs mb-6"><span className="kicker text-tangelo">Hypothesis · </span>{c.ambition}</p>
    <div className="grid lg:grid-cols-[1fr_1.6fr] gap-8">
      <div><p className="kicker text-tangelo mb-2">What would need to be true</p>{c.must_be_true.map((v, i) => <p key={i} className="font-mono text-xs py-1 border-b border-chocolate/15">{v}</p>)}</div>
      <div><p className="kicker text-tangelo mb-2">Where it could fail</p>{c.failures.map((f, i) => <div key={i} className="grid md:grid-cols-3 gap-2 py-2 border-b border-chocolate/15 font-mono text-[11px]" data-testid={`failure-${i}`}><p className="font-bold">{f.risk}</p><p><span className="kicker">Test · </span>{f.test}</p><p><span className="kicker">Change · </span>{f.change}</p></div>)}</div>
    </div>
  </>);
}

function Execution({ s, owner, save }) {
  const [edit, setEdit] = useState(false);
  const [b, setB] = useState(s.budget);
  useEffect(() => setB(s.budget), [s.budget]);
  const dirty = JSON.stringify(b) !== JSON.stringify(s.budget);
  const WHO = { independent: ["I can prototype this", "border-[#2F7D4F] text-[#2F7D4F]"], conduct: ["Needs Conduct", "border-tangelo text-tangelo"], both: ["Me with Conduct", "border-chocolate"] };
  return (<>
    <div className="space-y-0 border-t-2 border-chocolate mb-8" data-testid="booth-phases">{s.phases.map((p, i) => (
      <div key={i} className="grid md:grid-cols-[36px_1.3fr_1fr_1fr_1fr] gap-3 py-3 border-b border-chocolate/20 font-mono text-[11px]">
        <span className="text-tangelo">{i + 1}</span>
        <div><p className="font-bold text-xs">{p.phase}</p><span className={`inline-block mt-1 border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] ${WHO[p.who][1]}`}>{WHO[p.who][0]}</span></div>
        <p><span className="kicker">Deliverables · </span>{p.deliverables}</p>
        <p><span className="kicker">Owner · </span>{p.owner}<br /><span className="kicker">Depends on · </span>{p.deps}</p>
        <p><span className="kicker text-tangelo">Decision to proceed · </span>{p.decision}</p>
      </div>))}</div>
    <div className="flex items-center justify-between mb-2"><p className="kicker text-tangelo">Budget assumptions · not quotes, nothing confirmed</p>
      {owner && (!edit ? <button data-testid="budget-edit" onClick={() => setEdit(true)} className="font-mono text-[10px] uppercase tracking-[0.14em] underline-grow">Edit</button>
        : <span className="flex gap-3"><button data-testid="budget-cancel" onClick={() => { if (!dirty || window.confirm("Discard your unsaved changes?")) { setB(s.budget); setEdit(false); } }} className="font-mono text-[10px] uppercase">Cancel</button><button data-testid="budget-save" disabled={!dirty} onClick={async () => { await save({ budget: b }); setEdit(false); toast.success("Budget assumptions saved"); }} className="font-mono text-[10px] uppercase text-tangelo disabled:opacity-40">Save</button></span>)}</div>
    <table className="w-full font-mono text-[11px]" data-testid="booth-budget"><thead><tr className="kicker text-left">{["Item", "Low", "High", "Assumption"].map((h) => <th key={h} className="py-1.5 border-b-2 border-chocolate pr-2">{h}</th>)}</tr></thead>
      <tbody>{b.map((r, i) => <tr key={i} className="border-b border-chocolate/15">{["item", "low", "high", "note"].map((k) => <td key={k} className="py-1.5 pr-2">{edit && k !== "item" ? <input data-testid={`budget-${k}-${i}`} className="field !py-1 !text-[11px]" value={r[k]} onChange={(e) => setB(b.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} /> : (r[k] || <span className="opacity-40">{k === "item" ? "" : "Not estimated"}</span>)}</td>)}</tr>)}</tbody></table>
  </>);
}

function Measure({ docs }) {
  const ms = (docs?.measure?.metrics || []).filter((m) => m.campaign === "booth");
  const last = docs?.measure?.decision_history?.[0];
  return (<>
    <p className="font-mono text-xs mb-4 max-w-3xl">These measures live on the existing Did it work? page, alongside the SAP Score prototype metrics. Thresholds are proposals until validated against real baselines. The activation hasn't run, so nothing is measured.</p>
    <div className="border-t-2 border-chocolate" data-testid="booth-metrics">{ms.map((m) => (
      <details key={m.id} className="border-b border-chocolate/20 group" data-testid={`booth-metric-${m.id}`}>
        <summary className="grid md:grid-cols-[1.4fr_1fr_1fr] gap-3 py-3 cursor-pointer font-mono text-xs list-none">
          <span className="font-bold">{m.name}{m.area !== "Booth activation" && <span className="block kicker text-tangelo">Tracked separately</span>}</span>
          <span><span className="kicker">Threshold · </span>{m.threshold ? <>{m.threshold} <span className="text-tangelo">(proposal)</span></> : <span className="opacity-50">Not set</span>}</span>
          <span data-testid={`booth-result-${m.id}`}><span className="kicker">Result · </span>{m.actual || <b>Not measured</b>}</span>
        </summary>
        <div className="grid md:grid-cols-4 gap-4 pb-4 font-mono text-[11px] leading-relaxed">
          <p><span className="kicker text-tangelo block">Can establish</span>{m.can}</p><p><span className="kicker text-tangelo block">Cannot establish</span>{m.cannot}</p>
          <p><span className="kicker text-tangelo block">Baseline</span>{m.baseline}</p><p><span className="kicker text-tangelo block">Observation period</span>{m.period}</p>
        </div>
      </details>))}</div>
    <div className="grid md:grid-cols-3 gap-2 mt-6">{[["Proceed", "Evidence supports running it again or bigger."], ["Revise", "It shows potential, but one part needs fixing."], ["Stop", "Not enough relevant value to justify the effort."]].map(([t, d]) => <div key={t} className="border-2 border-chocolate p-3"><p className="font-display uppercase text-2xl leading-none">{t}</p><p className="font-mono text-[11px] mt-1">{d}</p></div>)}</div>
    <p className="font-mono text-xs mt-4">{last ? `Last recorded decision on the measurement page: ${last.state}${last.had_results ? "" : " (before results)"}.` : "No measurement decision recorded yet."} <Link to="/strategy/measure#booth" data-testid="booth-to-measure" className="text-tangelo underline-grow">Open the booth metrics on Did it work?</Link></p>
  </>);
}

function Decisions({ s, owner, save }) {
  const [edit, setEdit] = useState(false);
  const [d, setD] = useState({ decisions: s.decisions, verdict: s.verdict, verdict_reason: s.verdict_reason });
  useEffect(() => setD({ decisions: s.decisions, verdict: s.verdict, verdict_reason: s.verdict_reason }), [s]);
  const dirty = JSON.stringify(d) !== JSON.stringify({ decisions: s.decisions, verdict: s.verdict, verdict_reason: s.verdict_reason });
  return (<>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <p className="font-mono text-xs max-w-2xl">DIANA's critique (in the working brief below) is an input to these decisions, not a substitute for them. Grey lines are illustrative examples, not my recorded answers.</p>
      {owner && (!edit ? <button data-testid="decisions-edit" onClick={() => setEdit(true)} className="font-mono text-[10px] uppercase tracking-[0.14em] bg-linen text-chocolate px-4 py-2">Answer these</button>
        : <span className="flex gap-2"><button data-testid="decisions-cancel" onClick={() => { if (!dirty || window.confirm("Discard your unsaved changes?")) setEdit(false); }} className="font-mono text-[10px] uppercase border border-linen px-3 py-2">Cancel</button><button data-testid="decisions-save" disabled={!dirty} onClick={async () => { await save(d); setEdit(false); toast.success("Decisions saved"); }} className="font-mono text-[10px] uppercase bg-tangelo px-3 py-2 disabled:opacity-40">Save</button></span>)}
    </div>
    <div className="grid md:grid-cols-2 gap-x-8" data-testid="my-decisions">{d.decisions.map((x, i) => (
      <div key={i} className="py-3 border-b border-linen/20">
        <p className="font-mono text-xs font-bold mb-1">{x.q}</p>
        {edit ? <textarea data-testid={`decision-answer-${i}`} rows={2} className="field-dark !text-xs" value={x.a} onChange={(e) => setD({ ...d, decisions: d.decisions.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)) })} />
          : x.a ? <p className="font-mono text-xs" data-testid={`decision-answer-${i}-text`}>{x.a}</p> : <p className="font-mono text-[11px] text-linen/45 italic">{x.example}</p>}
      </div>))}</div>
    <div className="mt-6" data-testid="booth-verdict-form"><p className="font-mono text-xs font-bold mb-2">After reviewing the evidence: proceed, revise or stop?</p>
      {edit ? <><div className="flex gap-2 mb-2">{["proceed", "revise", "stop"].map((v) => <button key={v} data-testid={`verdict-${v}`} onClick={() => setD({ ...d, verdict: v })} className={`font-mono text-[11px] uppercase px-4 py-2 border-2 ${d.verdict === v ? "bg-tangelo border-tangelo" : "border-linen/40"}`}>{v}</button>)}</div><textarea data-testid="verdict-reason" rows={2} className="field-dark !text-xs" value={d.verdict_reason} onChange={(e) => setD({ ...d, verdict_reason: e.target.value })} placeholder="Why, and on what evidence?" /></>
        : <p className="font-mono text-[11px] text-linen/60">{s.verdict ? `${s.verdict}: ${s.verdict_reason}` : "Not decided. The activation hasn't run."}</p>}</div>
  </>);
}

export default function BoothStory({ c, save }) {
  const { owner } = useMode();
  const { docs } = useStrategy();
  const s = c.story;
  const saveStory = (patch) => save({ story: { ...s, ...patch } });
  return (
    <div className="border-2 border-chocolate bg-linen" data-testid="booth-story">
      <div className="bg-ink text-linen px-5 md:px-8 py-8 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
        <div><p className="font-mono text-[9px] tracking-[0.14em] uppercase bg-tangelo inline-block px-2 py-1 mb-4" data-testid="booth-label">{s.label}</p>
          <h2 className="font-display uppercase text-4xl md:text-5xl leading-[0.92]">The photograph is the hook. <span className="text-tangelo">The conversation is the opportunity.</span></h2>
          <p className="font-mono text-xs text-linen/70 mt-4 max-w-2xl">A playful Polaroid booth at a London enterprise technology event. A few questions, an illustrative SAP Score, a photo with Conduct's name on it, and a reason to talk.</p>
          <Link to="/score" data-testid="booth-play-score" className="inline-flex items-center gap-2 mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-botticelli hover:text-tangelo">Try the questions in the SAP Score prototype<ArrowRight className="w-3 h-3" /></Link></div>
        <Polaroid className="rotate-3 mx-auto" />
      </div>
      <nav className="sticky top-14 z-20 bg-chocolate text-linen flex overflow-x-auto scroll-thin" data-testid="booth-nav">{CH.map(([id, l], i) => <a key={id} href={`#booth-${id}`} data-testid={`booth-nav-${id}`} className="shrink-0 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] hover:text-tangelo border-r border-linen/15"><span className="text-tangelo mr-1">{String(i + 1).padStart(2, "0")}</span>{l}</a>)}</nav>
      <Chapter id="why" n={1} title="Why this idea?"><Why s={s.why} sources={docs?.narrative?.sources || []} /></Chapter>
      <Chapter id="journey" n={2} title="The visitor journey"><Journey j={s.journey} /></Chapter>
      <Chapter id="recruit" n={3} title="The recruitment branch"><Recruit r={s.recruitment} /></Chapter>
      <Chapter id="commercial" n={4} title="Why it could be commercially useful"><Commercial c={s.commercial} /></Chapter>
      <Chapter id="execution" n={5} title="Execution"><Execution s={s} owner={owner} save={saveStory} /></Chapter>
      <Chapter id="measure" n={6} title="Measurement"><Measure docs={docs} /></Chapter>
      <Chapter id="decisions" n={7} title="My decisions" dark><Decisions s={s} owner={owner} save={saveStory} /></Chapter>
      <Chapter id="next" n={8} title="What I'd decide next">
        <div className="grid md:grid-cols-3 gap-4 font-mono text-xs" data-testid="booth-next">
          <div className="bg-paper p-4"><p className="kicker text-tangelo mb-1">Recorded campaign decision</p><p className="font-display uppercase text-2xl">{c.decision || "None"}</p><p className="opacity-70 mt-1">Develop means keep shaping it. Nothing is booked.</p></div>
          <div className="bg-paper p-4"><p className="kicker text-tangelo mb-1">Next step before any commitment</p><p>Phase 3 and 4: prototype the card and QR page, then test with five to eight people whether they get both the joke and the company.</p></div>
          <div className="bg-paper p-4"><p className="kicker text-tangelo mb-1">After the evidence</p><p>{s.verdict ? `${s.verdict}: ${s.verdict_reason}` : "Not decided. Proceed, revise or stop is recorded in My decisions once there is evidence."}</p></div>
        </div>
        <a href="#booth-working" className="inline-flex items-center gap-2 mt-6 font-mono text-[10px] uppercase tracking-[0.14em] underline-grow">Working brief and agent critiques<ArrowDown className="w-3 h-3" /></a>
      </Chapter>
    </div>
  );
}
