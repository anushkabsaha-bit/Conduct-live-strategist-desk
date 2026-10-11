import React from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { useStrategy, useLocalDoc, logDecision } from "../../lib/strategy";
import { StrategyTabs, Section, Cite, Loading, SaveBar, Expand } from "../../components/StrategyKit";
import { Btn } from "../../components/kit";

const PERM = ["not requested", "requested", "granted", "refused"];
const APPR = ["not approved", "pending review", "approved"];
const BRANCH = ["not known yet", "supported by answers", "ruled out"];

function Outline({ d, set }) {
  const up = (i, p) => set({ outline: d.outline.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <ol className="grid md:grid-cols-5 gap-0 border-l-2 border-t-2 border-chocolate" data-testid="film-outline">
      {d.outline.map((o, i) => (
        <li key={o.id} className="border-r-2 border-b-2 border-chocolate p-4 bg-linen" data-testid={`outline-${o.id}`}>
          <p className="font-mono text-[10px] text-tangelo mb-1">{String(i + 1).padStart(2, "0")}</p>
          <p className="font-display uppercase text-2xl leading-none mb-3">{o.part}</p>
          <textarea data-testid={`outline-purpose-${o.id}`} className="field !text-xs min-h-[90px] mb-2" value={o.purpose} onChange={(e) => up(i, { purpose: e.target.value })} />
          <textarea data-testid={`outline-notes-${o.id}`} className="field !text-xs min-h-[70px] !bg-paper" placeholder="Notes" value={o.notes} onChange={(e) => up(i, { notes: e.target.value })} />
        </li>
      ))}
    </ol>
  );
}

function Interview({ iv, ri, d, set }) {
  const upQ = (qi, p) => set({ interviews: d.interviews.map((x, j) => (j !== ri ? x : { ...x, questions: x.questions.map((q, k) => (k === qi ? { ...q, ...p } : q)) })) });
  const add = () => set({ interviews: d.interviews.map((x, j) => (j !== ri ? x : { ...x, questions: [...x.questions, { q: "", answer: "", evidence: "", permission: "not requested", approval: "not approved" }] })) });
  const del = (qi) => set({ interviews: d.interviews.map((x, j) => (j !== ri ? x : { ...x, questions: x.questions.filter((_, k) => k !== qi) })) });
  const answered = iv.questions.filter((q) => q.answer.trim()).length;
  return (
    <Expand title={`${iv.who} · ${answered}/${iv.questions.length} answered`} testid={`interview-toggle-${iv.role}`} defaultOpen={ri === 0}>
      <div className="space-y-4" data-testid={`interview-${iv.role}`}>
        {iv.questions.map((q, qi) => (
          <div key={qi} className="grid lg:grid-cols-[1.2fr_1fr_1fr_160px] gap-2 pb-4 border-b border-chocolate/15">
            <div className="flex gap-2"><textarea data-testid={`iq-${iv.role}-${qi}`} className="field !font-serifit !text-base min-h-[60px]" value={q.q} placeholder="Question" onChange={(e) => upQ(qi, { q: e.target.value })} /><button onClick={() => del(qi)} data-testid={`iq-del-${iv.role}-${qi}`} className="opacity-40 hover:opacity-100 hover:text-tangelo self-start"><X className="w-3.5 h-3.5" /></button></div>
            <textarea data-testid={`ia-${iv.role}-${qi}`} className="field !text-xs min-h-[60px]" placeholder="Actual answer (empty until a real interview)" value={q.answer} onChange={(e) => upQ(qi, { answer: e.target.value })} />
            <textarea data-testid={`ie-${iv.role}-${qi}`} className="field !text-xs min-h-[60px]" placeholder="Source evidence for the answer" value={q.evidence} onChange={(e) => upQ(qi, { evidence: e.target.value })} />
            <div className="space-y-1">
              <select data-testid={`ip-${iv.role}-${qi}`} className="field !py-1 !text-[11px]" value={q.permission} onChange={(e) => upQ(qi, { permission: e.target.value })}>{PERM.map((x) => <option key={x} value={x}>{`Permission: ${x}`}</option>)}</select>
              <select data-testid={`iap-${iv.role}-${qi}`} className="field !py-1 !text-[11px]" value={q.approval} onChange={(e) => upQ(qi, { approval: e.target.value })}>{APPR.map((x) => <option key={x} value={x}>{`Approval: ${x}`}</option>)}</select>
            </div>
          </div>
        ))}
        <Btn variant="line" data-testid={`iq-add-${iv.role}`} onClick={add}><Plus className="w-3.5 h-3.5" />Add question</Btn>
      </div>
    </Expand>
  );
}

function Branches({ d, set }) {
  const up = (i, p) => set({ story_changes: d.story_changes.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <div className="space-y-0 border-t-2 border-chocolate" data-testid="story-changes">
      {d.story_changes.map((b, i) => (
        <div key={i} className={`grid md:grid-cols-[1fr_1fr_180px] gap-3 py-3 border-b border-chocolate/20 ${b.status === "ruled out" ? "opacity-50" : ""}`} data-testid={`branch-${i}`}>
          <p className="font-mono text-xs"><span className="kicker text-tangelo">If </span>{b.if}</p>
          <p className="font-mono text-xs"><span className="kicker text-tangelo">Then </span>{b.then}</p>
          <select data-testid={`branch-status-${i}`} className="field !py-1 !text-[11px]" value={b.status || "not known yet"} onChange={(e) => up(i, { status: e.target.value })}>{BRANCH.map((x) => <option key={x}>{x}</option>)}</select>
        </div>
      ))}
    </div>
  );
}

function Production({ d, set }) {
  const up = (i, p) => set({ production: d.production.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="film-production">
      {d.production.map((p, i) => (
        <div key={i} className={`p-4 border-2 ${p.status === "confirmed" ? "border-[#2F7D4F]" : "border-dashed border-chocolate/40"}`}>
          <div className="flex justify-between items-center mb-2"><span className="kicker">{p.kind}</span>
            <button data-testid={`prod-status-${i}`} onClick={() => up(i, { status: p.status === "idea" ? "confirmed" : "idea" })} className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 ${p.status === "confirmed" ? "bg-[#2F7D4F] text-linen" : "border border-chocolate"}`}>{p.status === "confirmed" ? "Confirmed resource" : "Idea only"}</button></div>
          <textarea className="field !text-xs min-h-[70px]" value={p.idea} onChange={(e) => up(i, { idea: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

export default function FilmPage() {
  const { docs, error, save, reload } = useStrategy();
  const L = useLocalDoc(docs?.film, save, "film");
  const d = L.d;
  if (!docs || !d) return <div><StrategyTabs /><Loading error={error} retry={reload} /></div>;
  const set = (p) => L.setD({ ...d, ...p });
  const unanswered = d.interviews.flatMap((iv) => iv.questions.filter((q) => q.q.trim() && !q.answer.trim()).map((q) => `${iv.role.replace("_", " ")}: ${q.q}`));
  const saveAll = async () => {
    const angleChanged = d.angle_reason !== docs.film.angle_reason && d.angle_reason.trim();
    if (await L.persist()) {
      if (angleChanged) await logDecision(docs.film, "Customer story · angle", "Film angle chosen", `${d.question} Reason: ${d.angle_reason}`);
      toast.success("Film concept saved");
    } else toast.error("Couldn't save. Your edits are still here.");
  };
  return (
    <div data-testid="film-page">
      <StrategyTabs />
      <header className="bg-ink text-linen px-5 md:px-10 pt-12 pb-10">
        <p className="font-mono text-[9px] tracking-[0.16em] uppercase bg-tangelo text-linen inline-block px-2 py-1 mb-5" data-testid="film-label">{d.label}</p>
        <p className="kicker text-botticelli mb-3">02 · The customer story · the question I want to investigate</p>
        <textarea data-testid="film-question" className="w-full bg-transparent font-serifit text-3xl md:text-5xl leading-[1.05] text-linen border-0 border-b border-linen/20 focus:border-tangelo outline-none resize-none" rows={3} value={d.question} onChange={(e) => set({ question: e.target.value })} />
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div><p className="kicker text-botticelli mb-2">Public starting point</p>{d.public_basis.map((b, i) => <p key={i} className="font-mono text-xs py-1 flex gap-2"><Cite ids={[b.src]} sources={docs.narrative.sources} />{b.text}</p>)}<p className="font-mono text-[10px] text-linen/50 mt-2">This is a proposed angle, not a description of Freudenberg's experience.</p></div>
          <div><p className="kicker text-botticelli mb-2">Why I chose this angle</p><textarea data-testid="film-angle-reason" className="field-dark min-h-[90px]" placeholder="What makes this the most interesting question, and for whom?" value={d.angle_reason} onChange={(e) => set({ angle_reason: e.target.value })} /></div>
        </div>
      </header>
      <Section n="A" title="Proposed film structure" sub="Five parts. Editable. The middle can only be written after real interviews."><Outline d={d} set={set} /></Section>
      <Section n="B" title="Interview preparation" sub="Questions for three people. Answers stay empty until a real conversation happens." tone="paper">
        <div className="max-w-6xl">{d.interviews.map((iv, ri) => <Interview key={iv.role} iv={iv} ri={ri} d={d} set={set} />)}</div>
        <div className="mt-6 max-w-3xl" data-testid="film-unanswered"><p className="kicker text-tangelo mb-2">Still unanswered · {unanswered.length}</p>{unanswered.slice(0, 6).map((q, i) => <p key={i} className="font-mono text-[11px] py-0.5">? {q}</p>)}{unanswered.length > 6 && <p className="font-mono text-[10px] opacity-60">and {unanswered.length - 6} more</p>}</div>
      </Section>
      <Section n="C" title="How the answers would change the story" sub="Mark a branch once real answers support it or rule it out."><Branches d={d} set={set} /></Section>
      <Section n="D" title="Production thinking" sub="Dashed means idea only. Solid means a confirmed resource or footage." tone="paper"><Production d={d} set={set} /></Section>
      <SaveBar dirty={L.dirty} busy={L.busy} onSave={saveAll} testid="film-save" />
    </div>
  );
}
