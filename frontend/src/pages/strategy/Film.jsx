import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { useStrategy, useLocalDoc, logDecision } from "../../lib/strategy";
import { useMode } from "../../lib/mode";
import { StrategyTabs, Section, Cite, Loading, Expand, T, EditBar } from "../../components/StrategyKit";
import { Btn } from "../../components/kit";

const PERM = ["not requested", "requested", "granted", "refused"];
const APPR = ["not approved", "pending review", "approved"];
const BRANCH = ["not known yet", "supported by answers", "ruled out"];

const Pick = ({ edit, value, opts, onChange, testid, prefix }) => edit
  ? <select data-testid={testid} className="field !py-1 !text-[11px]" value={value} onChange={(e) => onChange(e.target.value)}>{opts.map((x) => <option key={x} value={x}>{`${prefix}${x}`}</option>)}</select>
  : <p className="font-mono text-[10px] uppercase tracking-[0.1em]" data-testid={`${testid}-text`}>{prefix}{value}</p>;

function Outline({ d, set, edit }) {
  const up = (i, p) => set({ outline: d.outline.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <ol className="grid md:grid-cols-5 gap-0 border-l-2 border-t-2 border-chocolate" data-testid="film-outline">
      {d.outline.map((o, i) => (
        <li key={o.id} className="border-r-2 border-b-2 border-chocolate p-4 bg-linen" data-testid={`outline-${o.id}`}>
          <p className="font-mono text-[10px] text-tangelo mb-1">{String(i + 1).padStart(2, "0")}</p>
          <p className="font-display uppercase text-2xl leading-none mb-3">{o.part}</p>
          <T edit={edit} testid={`outline-purpose-${o.id}`} rows={4} className="!text-xs mb-2" readClass="font-mono text-xs leading-relaxed mb-3" value={o.purpose} onChange={(v) => up(i, { purpose: v })} />
          <T edit={edit} testid={`outline-notes-${o.id}`} rows={3} className="!text-xs !bg-paper" readClass="font-serifit italic text-base leading-snug opacity-80" value={o.notes} onChange={(v) => up(i, { notes: v })} />
        </li>
      ))}
    </ol>
  );
}

function Interview({ iv, ri, d, set, edit }) {
  const upQ = (qi, p) => set({ interviews: d.interviews.map((x, j) => (j !== ri ? x : { ...x, questions: x.questions.map((q, k) => (k === qi ? { ...q, ...p } : q)) })) });
  const add = () => set({ interviews: d.interviews.map((x, j) => (j !== ri ? x : { ...x, questions: [...x.questions, { q: "", answer: "", evidence: "", permission: "not requested", approval: "not approved" }] })) });
  const del = (qi) => set({ interviews: d.interviews.map((x, j) => (j !== ri ? x : { ...x, questions: x.questions.filter((_, k) => k !== qi) })) });
  const answered = iv.questions.filter((q) => q.answer.trim()).length;
  return (
    <Expand title={`${iv.who} · ${answered}/${iv.questions.length} answered`} testid={`interview-toggle-${iv.role}`} defaultOpen={ri === 0}>
      <div className="space-y-4" data-testid={`interview-${iv.role}`}>
        {iv.questions.map((q, qi) => (
          <div key={qi} className="grid lg:grid-cols-[1.2fr_1fr_1fr_170px] gap-3 pb-4 border-b border-chocolate/15">
            <div className="flex gap-2"><T edit={edit} testid={`iq-${iv.role}-${qi}`} rows={3} className="!font-serifit !text-base" readClass="font-serifit text-lg leading-snug" value={q.q} onChange={(v) => upQ(qi, { q: v })} />{edit && <button onClick={() => del(qi)} data-testid={`iq-del-${iv.role}-${qi}`} className="opacity-40 hover:opacity-100 hover:text-tangelo self-start"><X className="w-3.5 h-3.5" /></button>}</div>
            <div><p className="kicker opacity-50 mb-1">Answer</p><T edit={edit} testid={`ia-${iv.role}-${qi}`} rows={3} className="!text-xs" readClass="font-mono text-xs" placeholder="Empty until a real interview" empty="No answer yet. No interview has happened." value={q.answer} onChange={(v) => upQ(qi, { answer: v })} /></div>
            <div><p className="kicker opacity-50 mb-1">Evidence</p><T edit={edit} testid={`ie-${iv.role}-${qi}`} rows={3} className="!text-xs" readClass="font-mono text-xs" empty="None" value={q.evidence} onChange={(v) => upQ(qi, { evidence: v })} /></div>
            <div className="space-y-1">
              <Pick edit={edit} testid={`ip-${iv.role}-${qi}`} prefix="Permission: " opts={PERM} value={q.permission} onChange={(v) => upQ(qi, { permission: v })} />
              <Pick edit={edit} testid={`iap-${iv.role}-${qi}`} prefix="Approval: " opts={APPR} value={q.approval} onChange={(v) => upQ(qi, { approval: v })} />
            </div>
          </div>
        ))}
        {edit && <Btn variant="line" data-testid={`iq-add-${iv.role}`} onClick={add}><Plus className="w-3.5 h-3.5" />Add question</Btn>}
      </div>
    </Expand>
  );
}

function Branches({ d, set, edit }) {
  const up = (i, p) => set({ story_changes: d.story_changes.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <div className="border-t-2 border-chocolate" data-testid="story-changes">
      {d.story_changes.map((b, i) => (
        <div key={i} className={`grid md:grid-cols-[1fr_1fr_190px] gap-3 py-3 border-b border-chocolate/20 ${b.status === "ruled out" ? "opacity-50" : ""}`} data-testid={`branch-${i}`}>
          <p className="font-mono text-xs"><span className="kicker text-tangelo">If </span>{b.if}</p>
          <p className="font-mono text-xs"><span className="kicker text-tangelo">Then </span>{b.then}</p>
          <Pick edit={edit} testid={`branch-status-${i}`} prefix="" opts={BRANCH} value={b.status || "not known yet"} onChange={(v) => up(i, { status: v })} />
        </div>
      ))}
    </div>
  );
}

function Production({ d, set, edit }) {
  const up = (i, p) => set({ production: d.production.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="film-production">
      {d.production.map((p, i) => (
        <div key={i} className={`p-4 border-2 ${p.status === "confirmed" ? "border-[#2F7D4F]" : "border-dashed border-chocolate/40"}`}>
          <div className="flex justify-between items-center mb-2"><span className="kicker">{p.kind}</span>
            {edit ? <button data-testid={`prod-status-${i}`} onClick={() => up(i, { status: p.status === "idea" ? "confirmed" : "idea" })} className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 ${p.status === "confirmed" ? "bg-[#2F7D4F] text-linen" : "border border-chocolate"}`}>{p.status === "confirmed" ? "Confirmed resource" : "Idea only"}</button>
              : <span data-testid={`prod-status-${i}-text`} className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 ${p.status === "confirmed" ? "bg-[#2F7D4F] text-linen" : "border border-chocolate/50"}`}>{p.status === "confirmed" ? "Confirmed resource" : "Idea only"}</span>}</div>
          <T edit={edit} rows={3} className="!text-xs" readClass="font-mono text-xs leading-relaxed" value={p.idea} onChange={(v) => up(i, { idea: v })} />
        </div>
      ))}
    </div>
  );
}

export default function FilmPage() {
  const { docs, error, save, reload } = useStrategy();
  const { owner } = useMode();
  const L = useLocalDoc(docs?.film, save, "film");
  const [edit, setEdit] = useState(false);
  const d = L.d;
  if (!docs || !d) return <div><StrategyTabs /><Loading error={error} retry={reload} /></div>;
  const set = (p) => L.setD({ ...d, ...p });
  const unanswered = d.interviews.flatMap((iv) => iv.questions.filter((q) => q.q.trim() && !q.answer.trim()).map((q) => `${iv.role.replace("_", " ")}: ${q.q}`));
  const saveAll = async () => {
    const angleChanged = d.angle_reason !== docs.film.angle_reason && d.angle_reason.trim();
    if (!(await L.persist())) return toast.error("Couldn't save. Your edits are still here.");
    if (angleChanged) await logDecision(docs.film, "Customer story · angle", "Film angle chosen", `${d.question} Reason: ${d.angle_reason}`);
    setEdit(false); toast.success("Film concept saved");
  };
  return (
    <div data-testid="film-page">
      <StrategyTabs />
      <EditBar owner={owner} editing={edit} dirty={L.dirty} busy={L.busy} onEdit={() => setEdit(true)} onSave={saveAll} onCancel={() => { L.reset(); setEdit(false); }} label="Edit film concept" testid="film" />
      <div data-editable={edit ? "" : undefined}>
        <header className="bg-ink text-linen px-5 md:px-10 pt-12 pb-10">
          <p className="font-mono text-[9px] tracking-[0.16em] uppercase bg-tangelo text-linen inline-block px-2 py-1 mb-5" data-testid="film-label">{d.label}</p>
          <p className="kicker text-botticelli mb-3">02 · The customer story · the question I want to investigate</p>
          {edit ? <textarea data-testid="film-question" className="w-full bg-transparent font-serifit text-3xl md:text-5xl leading-[1.05] text-linen border-0 border-b border-linen/30 focus:border-tangelo outline-none resize-none" rows={3} value={d.question} onChange={(e) => set({ question: e.target.value })} />
            : <h1 data-testid="film-question-text" className="font-serifit text-3xl md:text-5xl leading-[1.05] max-w-5xl">{d.question}</h1>}
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div><p className="kicker text-botticelli mb-2">Public starting point</p>{d.public_basis.map((b, i) => <p key={i} className="font-mono text-xs py-1 flex gap-2"><Cite ids={[b.src]} sources={docs.narrative.sources} />{b.text}</p>)}<p className="font-mono text-[10px] text-linen/50 mt-2">A proposed angle, not a description of Freudenberg's experience.</p></div>
            <div><p className="kicker text-botticelli mb-2">Why I chose this angle</p>{edit ? <textarea data-testid="film-angle-reason" className="field-dark min-h-[90px]" value={d.angle_reason} onChange={(e) => set({ angle_reason: e.target.value })} /> : <p data-testid="film-angle-reason-text" className="font-mono text-xs leading-relaxed">{d.angle_reason || <span className="opacity-50">Not written yet.</span>}</p>}</div>
          </div>
        </header>
        <Section n="A" title="Proposed film structure" sub="Five parts. The middle can only be written after real interviews."><Outline d={d} set={set} edit={edit} /></Section>
        <Section n="B" title="Interview preparation" sub="Questions for three people. Answers stay empty until a real conversation happens." tone="paper">
          <div className="max-w-6xl">{d.interviews.map((iv, ri) => <Interview key={iv.role} iv={iv} ri={ri} d={d} set={set} edit={edit} />)}</div>
          <div className="mt-6 max-w-3xl" data-testid="film-unanswered"><p className="kicker text-tangelo mb-2">Still unanswered · {unanswered.length}</p>{unanswered.slice(0, 6).map((q, i) => <p key={i} className="font-mono text-[11px] py-0.5">? {q}</p>)}{unanswered.length > 6 && <p className="font-mono text-[10px] opacity-60">and {unanswered.length - 6} more</p>}</div>
        </Section>
        <Section n="C" title="How the answers would change the story" sub="Each branch is marked once real answers support it or rule it out."><Branches d={d} set={set} edit={edit} /></Section>
        <Section n="D" title="Production thinking" sub="Dashed means idea only. Solid means a confirmed resource or footage." tone="paper"><Production d={d} set={set} edit={edit} /></Section>
      </div>
    </div>
  );
}
