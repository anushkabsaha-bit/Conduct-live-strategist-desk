import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, Plus, X, ArrowRight } from "lucide-react";
import { http, list } from "../../lib/api";
import { useStrategy, logDecision } from "../../lib/strategy";
import { fmtDate } from "../../lib/meta";
import { LabelChip, Cite, SourceCard, StrategyTabs, Section, Expand, Loading } from "../../components/StrategyKit";
import { Btn } from "../../components/kit";

const words = (t) => (t || "").trim().split(/\s+/).filter(Boolean).length;
const cur = (d) => d.versions[d.versions.length - 1];

function Core({ doc }) {
  return (
    <Section id="core" n="A" title="Core narrative" sub="What is public, what I read into it, and what still needs Conduct.">
      <div className="grid lg:grid-cols-[1fr_320px] gap-10">
        <ol className="space-y-5 max-w-3xl" data-testid="core-narrative">
          {doc.core.map((p, i) => (
            <li key={i} className="grid grid-cols-[28px_1fr] gap-3 animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="font-mono text-[11px] text-chocolate/40 pt-1">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className={`${p.label === "verified" ? "font-mono text-sm" : "font-serifit text-xl"} leading-snug`}>{p.text}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2"><LabelChip label={p.label} /><Cite ids={p.src} sources={doc.sources} /></div>
              </div>
            </li>
          ))}
        </ol>
        <aside className="lg:border-l lg:border-chocolate/25 lg:pl-6" data-testid="sources-panel">
          <p className="kicker text-tangelo mb-3">Sources used</p>
          {doc.sources.map((s) => <SourceCard key={s.id} s={s} />)}
          <p className="font-mono text-[10px] italic opacity-60 mt-4">Independent portfolio work. Not commissioned, reviewed or approved by Conduct.</p>
        </aside>
      </div>
    </Section>
  );
}

function Audiences({ doc, save }) {
  const [tab, setTab] = useState(doc.priority_audience || doc.audiences[0].id);
  const [reason, setReason] = useState(doc.priority_reason || "");
  const a = doc.audiences.find((x) => x.id === tab);
  const choose = async () => {
    if (!reason.trim()) return toast.error("Add a reason before saving the priority audience.");
    await save("narrative", { priority_audience: a.id, priority_reason: reason });
    await logDecision(doc, "Launch narrative · priority audience", `Priority audience: ${a.name}`, reason);
    toast.success("Priority audience saved");
  };
  return (
    <Section id="audiences" n="B" title="Audience messaging" sub="Same facts. Different emphasis, different reason to care." tone="paper">
      <div className="flex flex-wrap gap-0 border-b-2 border-chocolate mb-6" role="tablist">
        {doc.audiences.map((x) => (
          <button key={x.id} data-testid={`audience-tab-${x.id}`} onClick={() => setTab(x.id)} className={`px-4 py-2.5 font-mono text-[11px] tracking-[0.12em] uppercase transition-colors ${tab === x.id ? "bg-chocolate text-linen" : "hover:text-tangelo"}`}>
            {x.name}{doc.priority_audience === x.id && <span className="ml-2 text-tangelo">● priority</span>}
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 animate-rise" key={a.id} data-testid={`audience-detail-${a.id}`}>
        <div>
          <p className="kicker text-tangelo mb-2">Core message</p>
          <p className="font-serifit text-2xl md:text-3xl leading-tight mb-6">{a.message}</p>
          <p className="kicker text-tangelo mb-1">Why it matters to them</p>
          <p className="font-mono text-sm leading-relaxed mb-6">{a.why}</p>
          <div className="border-2 border-chocolate p-4 tape bg-linen"><p className="kicker mb-1">Say it to someone else</p><p className="font-hand text-3xl leading-none" data-testid="audience-repeatable">"{a.repeatable}"</p></div>
        </div>
        <div className="space-y-5">
          <div><p className="kicker text-tangelo mb-2">Evidence</p>{a.evidence.map((e, i) => <div key={i} className="flex gap-2 py-1.5 border-b border-chocolate/15 font-mono text-xs"><Cite ids={[e.src]} sources={doc.sources} /><span>{e.text}</span></div>)}</div>
          <div><p className="kicker text-tangelo mb-1">What remains uncertain</p><p className="font-mono text-xs leading-relaxed">{a.uncertain}</p></div>
          <div className="bg-linen p-4 border-l-4 border-tangelo" data-testid="priority-audience-form">
            <p className="kicker mb-2">My call: which audience matters most for this launch?</p>
            <textarea data-testid="priority-reason" className="field min-h-[70px]" placeholder="Why this audience first?" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Btn data-testid="save-priority-audience" className="mt-2" onClick={choose}>Make {a.name.split(" ")[0]} my priority</Btn>
            {doc.priority_audience && <p className="font-mono text-[10px] mt-2 opacity-70">Saved: {doc.audiences.find((x) => x.id === doc.priority_audience)?.name}</p>}
          </div>
        </div>
      </div>
    </Section>
  );
}

function Evidence({ draft, doc, save }) {
  const text = cur(draft).text;
  const toggle = async (i) => {
    const k = `${draft.id}:${i}`, checks = { ...(doc.claim_checks || {}) };
    checks[k] = checks[k]?.checked ? { checked: false } : { checked: true, at: new Date().toISOString() };
    await save("narrative", { claim_checks: checks });
  };
  return (
    <aside className="bg-linen border-2 border-chocolate p-4 space-y-3" data-testid={`evidence-panel-${draft.direction}`}>
      <p className="kicker text-tangelo">Evidence panel · line by line</p>
      {draft.evidence.map((e, i) => {
        const present = text.includes(e.line), ok = doc.claim_checks?.[`${draft.id}:${i}`]?.checked;
        return (
          <div key={i} className="pb-3 border-b border-chocolate/15 last:border-0">
            <p className="font-mono text-[11px] bg-paper px-2 py-1 mb-1.5">"{e.line}"</p>
            <div className="flex flex-wrap items-center gap-2"><LabelChip label={e.label} /><Cite ids={e.src} sources={doc.sources} />{!present && <span className="font-mono text-[9px] uppercase text-tangelo">Line edited, recheck</span>}</div>
            <p className="font-mono text-[11px] opacity-75 mt-1.5 leading-relaxed">{e.note}</p>
            <label className="flex items-center gap-2 mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] cursor-pointer"><input type="checkbox" data-testid={`claim-check-${draft.direction}-${i}`} checked={!!ok} onChange={() => toggle(i)} className="accent-[#d54c15]" />I've checked this against the source</label>
          </div>
        );
      })}
    </aside>
  );
}

function Editor({ draft, onSaved }) {
  const [vi, setVi] = useState(draft.versions.length - 1);
  const [text, setText] = useState(cur(draft).text);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setVi(draft.versions.length - 1); setText(cur(draft).text); }, [draft]);
  const dirty = text !== cur(draft).text;
  const saveV = async () => {
    setBusy(true);
    try { await http.post(`/drafts/${draft.id}/versions`, { text, note: note || "Edited in Launch narrative", source: "user" }); setNote(""); await onSaved(); toast.success("Saved as a new version"); }
    catch { toast.error("Could not save. Your text is still here, try again."); } finally { setBusy(false); }
  };
  const viewing = draft.versions[vi];
  return (
    <div data-testid={`draft-editor-${draft.direction}`}>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="font-mono text-[9px] tracking-[0.14em] uppercase bg-tangelo text-linen px-1.5 py-0.5">Proposed · unapproved portfolio draft</span>
        <select data-testid="draft-version-select" className="field !w-auto !py-1 !text-[11px]" value={vi} onChange={(e) => { setVi(+e.target.value); setText(draft.versions[+e.target.value].text); }}>
          {draft.versions.map((v, i) => <option key={i} value={i}>v{v.n} · {v.note} · {fmtDate(v.created_at)}</option>)}
        </select>
        <span className="font-mono text-[10px] opacity-60">{words(text)} words</span>
      </div>
      <textarea data-testid="draft-textarea" className="field min-h-[360px] !font-serifit !text-lg leading-snug" value={text} onChange={(e) => setText(e.target.value)} />
      {vi !== draft.versions.length - 1 && <p className="font-mono text-[10px] text-tangelo mt-1">Viewing v{viewing.n}. Saving will create a new version from this text. Nothing is overwritten.</p>}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <input data-testid="draft-version-note" className="field !w-64 !py-1.5" placeholder="What did you change and why?" value={note} onChange={(e) => setNote(e.target.value)} />
        <Btn data-testid="save-draft-version" onClick={saveV} loading={busy} disabled={!dirty}>Save new version</Btn>
        <Link to={`/content?draft=${draft.id}`} data-testid="open-in-content-desk" className="font-mono text-[10px] tracking-[0.14em] uppercase underline-grow inline-flex items-center gap-1">Get AGATHA and BERDINE reviews in Content Desk<ArrowRight className="w-3 h-3" /></Link>
      </div>
    </div>
  );
}

function Compare({ drafts, doc, save }) {
  const [pick, setPick] = useState(doc.preferred_draft || "");
  const [why, setWhy] = useState(doc.preferred_reason || "");
  const submit = async () => {
    if (!pick || !why.trim()) return toast.error("Choose a direction and explain the choice.");
    const d = drafts.find((x) => x.id === pick);
    await save("narrative", { preferred_draft: pick, preferred_reason: why });
    await logDecision(doc, "Launch narrative · preferred direction", `Preferred direction: ${d.title}`, why);
    toast.success("Preferred direction saved");
  };
  return (
    <div data-testid="draft-compare">
      <div className="grid md:grid-cols-3 gap-0 border-l-2 border-t-2 border-chocolate">
        {drafts.map((d) => {
          const counts = d.evidence.reduce((m, e) => ({ ...m, [e.label]: (m[e.label] || 0) + 1 }), {});
          return (
            <label key={d.id} className={`border-r-2 border-b-2 border-chocolate p-5 cursor-pointer transition-colors ${pick === d.id ? "bg-paper" : "hover:bg-paper/60"}`} data-testid={`compare-col-${d.direction}`}>
              <div className="flex items-center gap-2 mb-3"><input type="radio" name="pref" checked={pick === d.id} onChange={() => setPick(d.id)} data-testid={`prefer-${d.direction}`} className="accent-[#d54c15]" /><span className="font-display uppercase text-xl leading-none">{d.title.split(": ")[1]}</span></div>
              <p className="font-mono text-[10px] opacity-60 mb-3">v{cur(d).n} · {words(cur(d).text)} words · {Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ")}</p>
              <p className="font-serifit text-base leading-snug whitespace-pre-line">{cur(d).text}</p>
            </label>
          );
        })}
      </div>
      <div className="mt-5 grid md:grid-cols-[1fr_auto] gap-3 items-end max-w-3xl">
        <textarea data-testid="preferred-reason" className="field min-h-[70px]" placeholder="Why this direction, and what would you still change?" value={why} onChange={(e) => setWhy(e.target.value)} />
        <Btn data-testid="save-preferred-direction" onClick={submit}>Save my decision</Btn>
      </div>
      {doc.preferred_draft && <p className="font-mono text-[11px] mt-2" data-testid="preferred-saved"><Check className="w-3 h-3 inline text-[#2F7D4F]" /> Current preference: {drafts.find((x) => x.id === doc.preferred_draft)?.title}</p>}
    </div>
  );
}

function Drafts({ doc, save, drafts, reload }) {
  const [mode, setMode] = useState("edit");
  const [sel, setSel] = useState(0);
  const d = drafts[sel];
  return (
    <Section id="drafts" n="C" title="Three LinkedIn directions" sub="Working versions, kept as written. Edit, check claims, then choose.">
      <div className="flex flex-wrap gap-2 mb-6">
        {drafts.map((x, i) => <button key={x.id} data-testid={`draft-select-${x.direction}`} onClick={() => { setSel(i); setMode("edit"); }} className={`px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] border-2 border-chocolate transition-colors ${mode === "edit" && sel === i ? "bg-chocolate text-linen" : "hover:bg-paper"}`}>{String(i + 1).padStart(2, "0")} {x.title.split(": ")[1]}{doc.preferred_draft === x.id && " ●"}</button>)}
        <button data-testid="draft-compare-toggle" onClick={() => setMode("compare")} className={`px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] border-2 border-tangelo transition-colors ${mode === "compare" ? "bg-tangelo text-linen" : "text-tangelo hover:bg-tangelo/10"}`}>Compare all three</button>
      </div>
      {mode === "compare" ? <Compare drafts={drafts} doc={doc} save={save} /> : (
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8"><Editor draft={d} onSaved={reload} /><Evidence draft={d} doc={doc} save={save} /></div>
      )}
    </Section>
  );
}

function Questions({ doc, save }) {
  const [q, setQ] = useState("");
  const qs = doc.questions || [];
  const add = async () => { if (!q.trim()) return; await save("narrative", { questions: [...qs, q.trim()] }); setQ(""); toast.success("Question saved"); };
  const del = (i) => save("narrative", { questions: qs.filter((_, j) => j !== i) });
  return (
    <Section id="questions" n="D" title="Questions for Conduct" sub="What I'd need answered before any of this could be published." tone="paper">
      <ul className="max-w-3xl" data-testid="conduct-questions">
        {qs.map((x, i) => <li key={i} className="flex items-start gap-3 py-2.5 border-b border-chocolate/20 font-mono text-sm"><span className="text-tangelo">?</span><span className="flex-1">{x}</span><button data-testid={`remove-question-${i}`} onClick={() => del(i)} className="opacity-50 hover:opacity-100 hover:text-tangelo"><X className="w-3.5 h-3.5" /></button></li>)}
        {!qs.length && <li className="font-mono text-xs opacity-60 py-2">No open questions recorded.</li>}
      </ul>
      <div className="flex gap-2 mt-4 max-w-3xl"><input data-testid="new-question-input" className="field" placeholder="Add an uncertainty or question for Conduct" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} /><Btn data-testid="add-question" onClick={add}><Plus className="w-3.5 h-3.5" />Add</Btn></div>
    </Section>
  );
}

export default function NarrativePage() {
  const { docs, error, save, reload } = useStrategy();
  const [drafts, setDrafts] = useState(null);
  const ids = docs?.narrative?.draft_ids;
  const loadDrafts = async () => { const all = await list("drafts"); setDrafts(ids.map((id) => all.find((x) => x.id === id)).filter(Boolean)); };
  useEffect(() => { if (ids) loadDrafts(); }, [ids?.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const doc = docs?.narrative;
  const ready = useMemo(() => doc && drafts, [doc, drafts]);
  useEffect(() => { if (ready && window.location.hash) setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" }), 100); }, [ready]);
  return (
    <div data-testid="narrative-page">
      <StrategyTabs />
      {!ready ? <Loading error={error} retry={reload} /> : (<>
        <header className="bg-linen text-chocolate px-5 md:px-10 pt-12 pb-8 border-b border-chocolate/20">
          <p className="kicker text-tangelo mb-4">01 · Launch narrative · strategy document</p>
          <h1 className="font-display uppercase leading-[0.92] text-4xl sm:text-5xl lg:text-6xl max-w-5xl">Keeping the system and the story <span className="text-tangelo">in sync</span></h1>
          <p className="font-mono text-xs mt-5 max-w-2xl leading-relaxed opacity-80">A proposed narrative for Conduct's publicly described work on SAP process documentation. Every line is labelled: verified public information, my interpretation, a proposed idea, a hypothesis, or something only Conduct can confirm.</p>
          <nav className="flex flex-wrap gap-4 mt-6 font-mono text-[10px] uppercase tracking-[0.14em]">{[["core", "A Core"], ["audiences", "B Audiences"], ["drafts", "C Drafts"], ["questions", "D Questions"]].map(([h, l]) => <a key={h} href={`#${h}`} className="underline-grow">{l}</a>)}</nav>
        </header>
        <Core doc={doc} />
        <Audiences doc={doc} save={save} />
        <Drafts doc={doc} save={save} drafts={drafts} reload={loadDrafts} />
        <Questions doc={doc} save={save} />
        <div className="bg-ink px-5 md:px-10 py-10"><Link to="/score" data-testid="narrative-to-score" className="font-display uppercase text-3xl md:text-4xl text-linen hover:text-tangelo inline-flex items-center gap-3">Next: invite participation with SAP Score<ArrowRight className="w-7 h-7" /></Link></div>
      </>)}
    </div>
  );
}
