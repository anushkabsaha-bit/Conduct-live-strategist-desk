import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AgentRunCard from "../components/AgentRunCard";
import { toast } from "sonner";
import { Plus, Save, Check, X, GitCompare, Send, Download } from "lucide-react";
import { AgentChip, Btn, Empty, Field, Kicker, Note, PageHead, Tag } from "../components/kit";
import { Claim, Output, PostChip } from "../components/Output";
import { RunView } from "../components/AgentRunCard";
import { useRuns } from "../components/useRuns";
import { create, http, list, recordDecision, update } from "../lib/api";
import { fmtDate } from "../lib/meta";
import { DraftFlags, OpeningChoice } from "../components/EditorialExtras";

const FORMATS = ["LinkedIn post", "Founder post", "Substack article", "Medium article", "Substack Note", "Short-form script", "Carousel concept", "Other"];
const words = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);

function diff(a, b) {
  const x = a.split(/(\s+)/), y = b.split(/(\s+)/);
  if (x.length * y.length > 400000) return { left: [[a, 0]], right: [[b, 0]] };
  const dp = Array.from({ length: x.length + 1 }, () => new Uint16Array(y.length + 1));
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const left = [], right = [];
  let i = 0, j = 0;
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) { left.push([x[i], 0]); right.push([y[j], 0]); i++; j++; }
    else if (j < y.length && (i >= x.length || dp[i][j + 1] >= dp[i + 1][j])) { right.push([y[j], 1]); j++; }
    else { left.push([x[i], -1]); i++; }
  }
  return { left, right };
}

function Compare({ versions }) {
  const [a, setA] = useState(Math.max(0, versions.length - 2));
  const [b, setB] = useState(versions.length - 1);
  const d = useMemo(() => diff(versions[a].text, versions[b].text), [versions, a, b]);
  const sel = (v, set) => <select className="field !w-auto" value={v} onChange={(e) => set(+e.target.value)}>{versions.map((x, i) => <option key={i} value={i}>{`v${x.n} · ${x.note || x.source}`}</option>)}</select>;
  return (
    <div data-testid="version-compare">
      <div className="grid md:grid-cols-2 gap-4">
        {[[a, setA, d.left, "Before"], [b, setB, d.right, "After"]].map(([v, set, parts, lab]) => (
          <div key={lab} className="border-2 border-chocolate bg-paper p-5">
            <div className="flex items-center justify-between mb-3"><p className="kicker text-tangelo">{lab}</p>{sel(v, set)}</div>
            <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{parts.map(([t, k], i) => <span key={i} className={k === -1 ? "bg-tangelo/25 line-through decoration-tangelo" : k === 1 ? "bg-botticelli/60" : ""}>{t}</span>)}</p>
            <p className="font-mono text-[10px] text-chocolate/60 mt-3">{words(versions[v].text)} words · {fmtDate(versions[v].created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Suggestions({ edits, runId, choice, setChoice, text, from }) {
  if (!edits?.length) return <Note>No line edits proposed.</Note>;
  return (
    <div className="space-y-3">
      {edits.map((e, i) => {
        const key = `${runId}:${e.id || i}`, c = choice[key], found = text.includes(e.before);
        return (
          <div key={key} data-testid={`suggestion-${from}-${i}`} className={`border p-3 transition-colors ${c === "accepted" ? "border-[#2F7D4F] bg-[#2F7D4F]/10" : c === "rejected" ? "border-chocolate/20 opacity-50" : "border-chocolate/40"}`}>
            <div className="flex flex-wrap gap-2 mb-2">{e.type && <Tag>{e.type}</Tag>}{e.priority && <Tag tone="blue">{e.priority}</Tag>}{e.from_agent && <Tag>{e.from_agent}</Tag>}{!found && <Tag tone="solid">Text not found in current version</Tag>}</div>
            <p className="font-mono text-xs line-through decoration-tangelo text-chocolate/60 mb-1">{e.before}</p>
            <p className="font-mono text-xs mb-2">{e.after}</p>
            <p className="font-mono text-[11px] text-chocolate/70 italic mb-2"><Claim text={e.rationale} /> {(e.evidence_post_ids || []).map((p) => <PostChip key={p} id={p} />)}</p>
            <div className="flex gap-2">
              <Btn variant={c === "accepted" ? "dark" : "line"} className="!py-1 !px-2" data-testid={`accept-${from}-${i}`} onClick={() => setChoice({ ...choice, [key]: c === "accepted" ? undefined : "accepted", [`${key}#e`]: e })}><Check className="w-3 h-3" />Accept</Btn>
              <Btn variant={c === "rejected" ? "dark" : "line"} className="!py-1 !px-2" data-testid={`reject-${from}-${i}`} onClick={() => setChoice({ ...choice, [key]: c === "rejected" ? undefined : "rejected", [`${key}#e`]: e })}><X className="w-3 h-3" />Reject</Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const SENT = { working: "green", unclear: "blue", generic: "line", unsupported: "solid" };

function AgathaView({ o, run, ctx }) {
  return (
    <div className="space-y-6">
      <p className="font-serifit italic text-xl leading-snug"><Claim text={o.headline} /></p>
      <div className="flex flex-wrap gap-2"><Tag tone="dark">Confidence: {o.confidence}</Tag></div>
      <Output data={{ strongest_idea: o.strongest_idea, biggest_weakness: o.biggest_weakness, problem_or_announcement: o.problem_or_announcement }} />
      <div data-testid="agatha-sentences"><p className="kicker text-tangelo mb-2">Sentence by sentence</p>
        {(o.sentences || []).map((x, i) => <div key={i} className="py-2 border-b border-chocolate/15 font-mono text-xs"><Tag tone={SENT[x.verdict] || "line"} className="mr-2">{x.verdict}</Tag><span className="italic">"{x.sentence}"</span><p className="text-chocolate/70 mt-1"><Claim text={x.why} /></p></div>)}
      </div>
      <div><p className="kicker text-tangelo mb-2">Observations</p>
        {(o.observations || []).map((x, i) => <div key={i} className="py-2 border-b border-chocolate/15 font-mono text-xs leading-relaxed"><Tag tone={x.label === "DATASET" ? "blue" : x.label === "HYPOTHESIS" ? "line" : "dark"} className="mr-2">{x.label}</Tag><Claim text={x.point} /> {(x.evidence_post_ids || []).filter((p) => !x.point.includes(p)).map((p) => <PostChip key={p} id={p} />)}</div>)}
      </div>
      <div data-testid="agatha-relevant-posts"><p className="kicker text-tangelo mb-2">Historical posts behind this (click to inspect)</p>{(o.relevant_posts || []).map((p) => <p key={p.post_id} className="font-mono text-xs mb-1.5"><PostChip id={p.post_id} /> <Claim text={p.why_relevant} /></p>)}</div>
      <div><p className="kicker text-tangelo mb-2">Suggested edits</p><Suggestions edits={o.edits} runId={run.id} from="agatha" {...ctx} /></div>
      <Output data={{ success_beyond_engagement: o.success_beyond_engagement, sample_and_limits: o.sample_and_limits, experiments: o.experiments }} />
    </div>
  );
}

function BerdineView({ o, run, ctx }) {
  return (
    <div className="space-y-6">
      <p className="font-serifit italic text-xl leading-snug"><Claim text={o.headline} /></p>
      <Tag tone="blue">{o.voice_profile_note || "Inferred voice profile, no internal style guide supplied"}</Tag>
      <Output data={{ assessment: o.assessment, sounds_human: o.sounds_human, sounds_like_company_copy: o.sounds_like_company_copy, customer_reference: o.customer_reference }} />
      <div><p className="kicker text-tangelo mb-2">Line edits</p><Suggestions edits={o.edits} runId={run.id} from="berdine" {...ctx} /></div>
      <div><p className="kicker text-tangelo mb-2">Revised draft</p><p className="font-mono text-sm whitespace-pre-wrap bg-linen border border-chocolate/30 p-4">{o.revised_draft}</p>
        <button data-testid="berdine-use-version" onClick={() => ctx.loadText(o.revised_draft, "BERDINE revised draft")} className="font-mono text-[10px] tracking-[0.14em] uppercase text-tangelo underline-grow mt-2">Load into editor (save to keep)</button></div>
      <Output data={{ meaningful_edits_explained: o.meaningful_edits_explained, verify_before_publishing: o.verify_before_publishing }} />
    </div>
  );
}

function SynthesisView({ o, run, ctx }) {
  return (
    <div className="space-y-6">
      <p className="font-serifit italic text-xl leading-snug"><Claim text={o.summary} /></p>
      <div data-testid="ana-decisions"><p className="kicker text-botticelli mb-2">Two decisions for you</p>{(o.decisions_for_anushka || []).map((d, i) => <div key={i} className="border border-linen/30 p-3 mb-2 font-mono text-xs"><p className="font-bold mb-1"><Claim text={d.decision} /></p><p className="text-linen/70">{(d.options || []).join(" / ")}</p><p className="text-linen/60 italic mt-1"><Claim text={d.why_it_matters} /></p></div>)}</div>
      <Output dark data={{ agreements: o.agreements, conflicts: o.conflicts, evidence_backed: o.evidence_backed, hypotheses_only: o.hypotheses_only, unknowns: o.unknowns }} />
      <div className="bg-linen text-chocolate p-3"><p className="kicker text-tangelo mb-2">Edits ANA thinks are worth considering. You decide.</p><Suggestions edits={o.recommended_edits} runId={run.id} from="ana" {...ctx} /></div>
    </div>
  );
}

const DECISIONS = ["Keep as draft", "Change direction", "Ready for review with colleagues", "Approved by me", "Rejected"];

function judgement(draft, reviewed) {
  const d = draft.decision || {};
  if (d.final) return ["Decision recorded", "green"];
  if ((d.facts_to_check || "").trim()) return ["Fact check required", "solid"];
  if (reviewed) return ["Needs your judgement", "blue"];
  return ["Not reviewed yet", "line"];
}

function MyDecision({ draft, reviews, reload, cur }) {
  const [d, setD] = useState(draft.decision || {});
  useEffect(() => setD(draft.decision || {}), [draft.id]); // eslint-disable-line
  const s = (k) => (e) => setD({ ...d, [k]: e.target.value });
  const ag = reviews.ag?.output, be = reviews.be?.output;
  const original = draft.versions[0].text;
  const saveNotes = async () => { await update("drafts", draft.id, { decision: { ...d, saved_at: new Date().toISOString() } }); toast.success("Your notes are saved with the draft"); reload(); };
  const record = async () => {
    const entry = { final: d.final, reasoning: d.reasoning, angle_reason: d.angle_reason, reflection: d.reflection, facts_to_check: d.facts_to_check, on_version: cur.n, at: new Date().toISOString() };
    const statusMap = { "Keep as draft": "draft", "Change direction": "draft", "Ready for review with colleagues": "in_review", "Approved by me": "approved", Rejected: "rejected" };
    await update("drafts", draft.id, { decision: { ...d, history: [...(d.history || []), entry] }, status: statusMap[d.final] });
    await recordDecision({ ref_type: "draft", ref_id: draft.id, choice: d.final, label: draft.title, note: `${d.reasoning || ""} (v${cur.n})`, angle_reason: d.angle_reason, facts_to_check: d.facts_to_check, agree: d.agree, disagree: d.disagree, missed: d.missed, reflection: d.reflection });
    toast.success(`Decision recorded on v${cur.n}`); reload();
  };
  const [label, tone] = judgement(draft, ag || be);
  return (
    <div className="border-2 border-tangelo bg-paper" data-testid="my-editorial-decision">
      <div className="bg-tangelo text-linen px-5 py-3 flex flex-wrap justify-between items-center gap-2"><p className="font-display uppercase text-2xl">My editorial decision</p><Tag tone={tone} data-testid="judgement-status" className="!bg-linen !text-chocolate">{label}</Tag></div>
      <div className="p-5 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div><p className="kicker text-tangelo mb-2">Original (v1, as I wrote it)</p><p data-testid="decision-original" className="font-mono text-sm whitespace-pre-wrap border border-chocolate/30 p-4 bg-linen">{original}</p></div>
          <div><p className="kicker text-tangelo mb-2">{be?.revised_draft ? "BERDINE's revision" : `Current v${cur.n}`}</p><p className="font-mono text-sm whitespace-pre-wrap border border-chocolate/30 p-4 bg-linen">{be?.revised_draft || cur.text}</p></div>
        </div>
        {(ag || be) && (
          <div className="grid md:grid-cols-2 gap-4" data-testid="decision-agent-compare">
            {[["AGATHA says", ag && [`Strongest: ${ag.strongest_idea}`, `Weakest: ${ag.biggest_weakness}`, `Confidence: ${ag.confidence}`]], ["BERDINE says", be && [be.headline, ...(be.sounds_like_company_copy || []).slice(0, 2).map((x) => `Company copy: ${x}`)]]].map(([t, xs]) => (
              <div key={t} className="border border-chocolate/30 p-3"><p className="kicker text-tangelo mb-2">{t}</p>{xs ? xs.map((x, i) => <p key={i} className="font-mono text-xs mb-1"><Claim text={x} /></p>) : <Note>Not run yet.</Note>}</div>
            ))}
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="What I agree with"><textarea data-testid="decision-agree" className="field" rows={3} value={d.agree || ""} onChange={s("agree")} /></Field>
          <Field label="What I disagree with, and why"><textarea data-testid="decision-disagree" className="field" rows={3} value={d.disagree || ""} onChange={s("disagree")} /></Field>
          <Field label="What the agents missed"><textarea data-testid="decision-missed" className="field" rows={3} value={d.missed || ""} onChange={s("missed")} /></Field>
          <Field label="Facts to check (product, founders, customer-facing colleagues)"><textarea data-testid="decision-facts" className="field" rows={3} value={d.facts_to_check || ""} onChange={s("facts_to_check")} /></Field>
          <div className="md:col-span-2"><Field label="Why I chose the final angle"><textarea data-testid="decision-angle" className="field" rows={2} value={d.angle_reason || ""} onChange={s("angle_reason")} /></Field></div>
          <div className="md:col-span-2"><Field label="What do I think matters here that the data alone cannot tell me?"><textarea data-testid="decision-reflection" className="field" rows={3} value={d.reflection || ""} onChange={s("reflection")} /></Field></div>
        </div>
        <Btn variant="line" data-testid="decision-save-notes" onClick={saveNotes}>Save my notes</Btn>
        <div className="grid md:grid-cols-[260px_1fr_auto] gap-3 items-end border-t border-chocolate/30 pt-5">
          <Field label="My decision"><select data-testid="decision-final" className="field" value={d.final || ""} onChange={s("final")}><option value="">Choose…</option>{DECISIONS.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Reasoning"><input data-testid="decision-reasoning" className="field" value={d.reasoning || ""} onChange={s("reasoning")} /></Field>
          <Btn variant="accent" data-testid="decision-record" disabled={!d.final || !(d.reasoning || "").trim()} onClick={record}>Record decision on v{cur.n}</Btn>
        </div>
        {(draft.decision?.history || []).length > 0 && <div data-testid="decision-history"><p className="kicker text-tangelo mb-1">Decision history</p>{draft.decision.history.slice().reverse().map((h, i) => <p key={i} className="font-mono text-xs py-1 border-b border-chocolate/15">{fmtDate(h.at)} · v{h.on_version} · <b>{h.final}</b> · {h.reasoning}</p>)}</div>}
        <Note>Agents never approve or publish. Only this section changes the draft's status.</Note>
      </div>
    </div>
  );
}

const CHANNELS = ["LinkedIn (company)", "LinkedIn (founder)", "Substack", "Medium", "Company blog", "Founder communications", "Short-form video"];
const STAGE_LIST = [["A", "Choose the direction"], ["B", "Review the evidence"], ["C", "Write & adapt"], ["D", "Explain the choices"], ["F", "One idea, different formats"]];

function TextOut({ o, loadText, extra }) {
  return <div><Output data={o} />{o.draft && <div className="flex flex-wrap gap-4 mt-4"><button data-testid="load-generated-draft" onClick={() => loadText(o.draft, `BERDINE ${o.channel || "draft"}`)} className="font-mono text-[10px] tracking-[0.14em] uppercase text-tangelo underline-grow">Load into editor (save to keep)</button>{extra && extra(o)}</div>}</div>;
}

function Stages({ draft, stage, setStage, meta, loadText, reload, setId }) {
  const b = draft.brief || {};
  const [target, setTarget] = useState("Substack");
  const [instr, setInstr] = useState("");
  const [chs, setChs] = useState(["LinkedIn (company)", "Substack", "Medium", "Founder communications"]);
  const setB = (k, v) => meta("brief", { ...b, [k]: v });
  const brief = () => ({ ...b, format: draft.format, word_limit: draft.word_limit || "none supplied" });
  const saveAsDraft = async (o) => {
    const d = await create("drafts", { title: `${draft.title} (${o.channel || target})`, format: o.channel || target, audience: draft.audience, objective: draft.objective, word_limit: null, status: "draft", brief: { ...b, channel: o.channel || target, derived_from: draft.id }, versions: [{ n: 1, text: o.draft, note: `BERDINE adaptation for ${o.channel || target}`, source: "agent", created_at: new Date().toISOString() }] });
    toast.success("Saved as a separate draft. The original is untouched."); await reload(); setId(d.id);
  };
  return (
    <div className="border-2 border-chocolate bg-paper" data-testid="writing-stages">
      <div className="flex flex-wrap border-b-2 border-chocolate">{STAGE_LIST.map(([k, l]) => <button key={k} data-testid={`stage-tab-${k}`} onClick={() => setStage(k)} className={`px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase border-r border-chocolate/30 transition-colors ${stage === k ? "bg-chocolate text-linen" : "hover:bg-botticelli/20"}`}><span className="text-tangelo mr-1">{k}</span>{l}</button>)}</div>
      <div className="p-5 space-y-5">
        {stage === "A" && <>
          <div className="grid md:grid-cols-3 gap-3" key={draft.id}>
            <div className="md:col-span-3"><Field label="Subject or initial idea"><textarea data-testid="brief-subject" className="field" rows={2} defaultValue={b.subject || ""} onBlur={(e) => setB("subject", e.target.value)} /></Field></div>
            <Field label="Publishing channel"><select data-testid="brief-channel" className="field" value={b.channel || ""} onChange={(e) => setB("channel", e.target.value)}><option value="">Choose…</option>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Coverage"><select data-testid="brief-coverage" className="field" value={b.coverage || ""} onChange={(e) => setB("coverage", e.target.value)}><option value="">Choose…</option>{["First time covering this", "Follow-up", "Recurring series"].map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Deadline"><input type="date" className="field" defaultValue={b.deadline || ""} onBlur={(e) => setB("deadline", e.target.value)} /></Field>
            <div className="md:col-span-3"><Field label="Source material (rough idea, announcement, transcript, document)"><textarea data-testid="brief-source" className="field" rows={3} defaultValue={b.source_material || ""} onBlur={(e) => setB("source_material", e.target.value)} /></Field></div>
          </div>
          <AgentRunCard agent="edith" task="edith.content_direction" refType="draft" refId={draft.id} label="Story direction & evidence needed" getInput={brief} hint="Audience, objective and word limit come from the fields above the editor." />
        </>}
        {stage === "B" && <AgentRunCard agent="agatha" task="agatha.evidence_patterns" refType="draft" refId={draft.id} label="Relevant patterns in Conduct's 38 posts" getInput={brief} hint="Each pattern shows what was observed, how many posts, the measure, and its limits. External hook-length claims are treated as hypotheses only." />}
        {stage === "C" && <>
          <AgentRunCard agent="berdine" task="berdine.write_draft" refType="draft" refId={draft.id} label="Write from the agreed direction" getInput={brief} render={(o) => <TextOut o={o} loadText={loadText} />} />
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Adapt for channel"><select data-testid="adapt-channel" className="field" value={target} onChange={(e) => setTarget(e.target.value)}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <div className="md:col-span-2"><Field label="Instruction (optional)"><input data-testid="adapt-instruction" className="field" value={instr} onChange={(e) => setInstr(e.target.value)} placeholder="e.g. shorter, change the opening, for engineers, 3 alternative hooks" /></Field></div>
          </div>
          <AgentRunCard agent="berdine" task="berdine.adapt_channel" refType="draft" refId={draft.id} label="Adapt or rework" getInput={() => ({ ...brief(), target_channel: target, instruction: instr || "none" })} render={(o) => <TextOut o={o} loadText={loadText} extra={(x) => <button data-testid="save-adapted-draft" onClick={() => saveAsDraft(x)} className="font-mono text-[10px] tracking-[0.14em] uppercase text-tangelo underline-grow">Save as a separate {x.channel || target} draft</button>} />} />
        </>}
        {stage === "D" && <AgentRunCard agent="berdine" task="berdine.editorial_note" refType="draft" refId={draft.id} label="Why this draft is written this way" hint="Explains the actual choices in the current saved version." />}
        {stage === "F" && <>
          <div className="flex flex-wrap gap-3">{CHANNELS.map((c) => <label key={c} className="flex items-center gap-2 font-mono text-xs"><input type="checkbox" className="accent-tangelo" checked={chs.includes(c)} onChange={() => setChs(chs.includes(c) ? chs.filter((x) => x !== c) : [...chs, c])} />{c}</label>)}</div>
          <AgentRunCard agent="berdine" task="berdine.one_idea_formats" refType="draft" refId={draft.id} label="One idea, different formats" getInput={() => ({ subject: b.subject || draft.title, channels: chs, source_material: b.source_material || "" })} />
        </>}
      </div>
    </div>
  );
}

export default function ContentDesk() {
  const [drafts, setDrafts] = useState([]);
  const [id, setId] = useState(null);
  const [text, setText] = useState("");
  const [choice, setChoice] = useState({});
  const [routed, setRouted] = useState(false);
  const [params] = useSearchParams();
  const [stage, setStage] = useState("A");
  const load = useCallback(async () => { const d = await list("drafts"); setDrafts(d); setId((cur) => cur || params.get("draft") || d[0]?.id); return d; }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  const draft = drafts.find((d) => d.id === id);
  const cur = draft?.versions[draft.versions.length - 1];
  useEffect(() => { if (cur) setText(cur.text); setChoice({}); setRouted(false); }, [id, cur?.n]); // eslint-disable-line
  const ag = useRuns("agatha.review", "draft", id), be = useRuns("berdine.review", "draft", id), syn = useRuns("ana.synthesis", "draft", id);

  const meta = async (k, v) => { await update("drafts", id, { [k]: v }); load(); };
  const newDraft = async () => {
    const d = await create("drafts", { title: "Untitled draft", format: "LinkedIn post", audience: "", objective: "", word_limit: null, status: "draft", versions: [{ n: 1, text: "", note: "Original", source: "user", created_at: new Date().toISOString() }] });
    await load(); setId(d.id);
  };
  const saveVersion = async (t, note, extra = {}) => {
    await http.post(`/drafts/${id}/versions`, { text: t, note, ...extra });
    toast.success("Saved as a new version, the original is kept"); load();
  };
  const accepted = Object.keys(choice).filter((k) => !k.endsWith("#e") && choice[k] === "accepted");
  const rejected = Object.keys(choice).filter((k) => !k.endsWith("#e") && choice[k] === "rejected");
  const applyAccepted = async () => {
    let t = text, miss = 0;
    accepted.forEach((k) => { const e = choice[`${k}#e`]; if (t.includes(e.before)) t = t.replace(e.before, e.after); else miss++; });
    await saveVersion(t, `Applied ${accepted.length - miss} accepted suggestion(s)`, { source: "accepted_suggestions", accepted: accepted.map((k) => choice[`${k}#e`]), rejected: rejected.map((k) => choice[`${k}#e`]) });
    if (miss) toast.warning(`${miss} accepted edit(s) could not be applied automatically, the text had changed.`);
  };
  const route = () => {
    setRouted(true);
    const input = { format: draft.format, audience: draft.audience, objective: draft.objective, word_limit: draft.word_limit || "none supplied" };
    ag.run(input); be.run(input);
  };
  const setStatus = async (s, label) => {
    await update("drafts", id, { status: s });
    await recordDecision({ ref_type: "draft", ref_id: id, choice: s, note: `${label} by Anushka on v${cur.n}` });
    toast.success(label); load();
  };
  const ctx = { choice, setChoice, text: cur?.text || "", loadText: (t, n) => { setText(t); toast(`Loaded ${n} into the editor. Save as a new version to keep it.`); } };
  const both = ag.latest && be.latest;

  return (
    <div>
      <PageHead n="02" kicker="Content Desk" title="Content desk" accent="." sub="Idea to reviewed draft without losing the original. AGATHA and BERDINE review independently; ANA synthesises; you decide." />
      <section className="bg-linen text-chocolate px-5 md:px-10 pb-16">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          <aside>
            <div className="flex items-center justify-between mb-3"><p className="kicker text-tangelo">Drafts</p><Btn variant="line" className="!px-2 !py-1" data-testid="new-draft-btn" onClick={newDraft}><Plus className="w-3 h-3" />New</Btn></div>
            <div className="border-t-2 border-chocolate">
              {drafts.map((d) => (
                <button key={d.id} data-testid={`draft-item-${d.id}`} onClick={() => setId(d.id)} className={`w-full text-left py-3 px-2 border-b border-chocolate/25 transition-colors ${d.id === id ? "bg-chocolate text-linen" : "hover:bg-botticelli/20"}`}>
                  <p className="font-mono text-xs font-bold">{d.title}</p><p className="font-mono text-[10px] opacity-70 mt-1">{d.format} · v{d.versions.length} · {d.status}</p>
                </button>
              ))}
            </div>
          </aside>
          {!draft ? <Empty title="No draft selected.">Create a new draft to begin.</Empty> : (
            <div className="space-y-8 min-w-0">
              {draft.provenance && <Tag tone="blue">{draft.provenance}</Tag>}
              <DraftFlags draft={draft} text={text} />
              <OpeningChoice draft={draft} cur={cur} reload={load} />
              {draft.versions[0]?.source === "handoff" && draft.brief?.source_material && <details data-testid="handoff-context-panel" className="border border-chocolate/30 bg-paper p-3" open><summary className="kicker text-tangelo cursor-pointer">Context handed over: {draft.versions[0].note}</summary><pre className="whitespace-pre-wrap font-mono text-[11px] mt-2 max-h-64 overflow-auto">{draft.brief.source_material}</pre></details>}
              <div className="grid md:grid-cols-6 gap-3">
                <div className="md:col-span-2"><Field label="Title"><input data-testid="draft-title-input" className="field" defaultValue={draft.title} key={`t${id}`} onBlur={(e) => meta("title", e.target.value)} /></Field></div>
                <Field label="Format"><select data-testid="draft-format-select" className="field" value={draft.format} onChange={(e) => meta("format", e.target.value)}>{FORMATS.map((f) => <option key={f}>{f}</option>)}</select></Field>
                <Field label="Audience"><input data-testid="draft-audience-input" className="field" defaultValue={draft.audience} key={`a${id}`} onBlur={(e) => meta("audience", e.target.value)} /></Field>
                <Field label="Objective"><input data-testid="draft-objective-input" className="field" defaultValue={draft.objective} key={`o${id}`} onBlur={(e) => meta("objective", e.target.value)} /></Field>
                <Field label="Word limit (optional)"><input data-testid="draft-wordlimit-input" type="number" className="field" defaultValue={draft.word_limit || ""} key={`w${id}`} onBlur={(e) => meta("word_limit", e.target.value ? +e.target.value : null)} placeholder="none" /></Field>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="kicker text-tangelo">Editor · current v{cur.n} · {words(text)} words{draft.word_limit ? ` / limit ${draft.word_limit}` : ""}{draft.word_limit && words(text) > draft.word_limit && <span className="ml-2 bg-tangelo text-linen px-1">over limit</span>}</p>
                  <Btn variant="line" data-testid="export-draft-btn" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = `${draft.title.replace(/\W+/g, "-")}-v${cur.n}.txt`; a.click(); }}><Download className="w-3.5 h-3.5" />Export</Btn>
                  <Btn data-testid="save-version-btn" onClick={() => saveVersion(text, "Manual edit")} disabled={text === cur.text}><Save className="w-3.5 h-3.5" />Save as v{cur.n + 1}</Btn>
                </div>
                <textarea data-testid="draft-editor" className="field !text-base leading-relaxed min-h-[280px] spotlight" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste or write your draft…" />
              </div>

              <Stages draft={draft} stage={stage} setStage={setStage} meta={meta} loadText={ctx.loadText} reload={load} setId={setId} />
              <p className="kicker text-tangelo pt-2">Review the current version</p>
              <div className="bg-chocolate text-linen p-5 md:p-6" style={{ borderTop: "6px solid #6E4BB8" }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><AgentChip id="ana" /><p className="font-display uppercase text-xl">Route for review</p></div>
                  <Btn variant="lineDark" data-testid="route-review-btn" onClick={route} loading={ag.running || be.running} disabled={!cur.text.trim() || text !== cur.text}><Send className="w-3.5 h-3.5" />Send v{cur.n} to AGATHA + BERDINE</Btn>
                </div>
                {text !== cur.text && <p className="font-mono text-[11px] text-botticelli mt-2">Save your edits as a new version before sending for review.</p>}
                {routed && <p data-testid="ana-routing-note" className="font-mono text-xs text-linen/80 mt-3">ANA routing (rule-based workflow): a {draft.format} draft for review → AGATHA for evidence against the 38-post dataset, BERDINE for voice, clarity and audience fit. Both now running independently on v{cur.n}.</p>}
              </div>

              <div className="grid xl:grid-cols-2 gap-6">
                <RunView agent="agatha" task="agatha.review" label="Performance review" hook={ag} version={cur.n} getInput={() => ({ format: draft.format, audience: draft.audience, objective: draft.objective, word_limit: draft.word_limit || "none supplied" })} render={(o, r) => <AgathaView o={o} run={r} ctx={ctx} />} />
                <RunView agent="berdine" task="berdine.review" label="Editorial review" hook={be} version={cur.n} getInput={() => ({ format: draft.format, audience: draft.audience, objective: draft.objective, word_limit: draft.word_limit || "none supplied" })} render={(o, r) => <BerdineView o={o} run={r} ctx={ctx} />} />
              </div>
              <RunView dark agent="ana" task="ana.synthesis" label="Synthesis" hook={syn} version={cur.n} hint={both ? "Both reviews exist. Ask ANA to synthesise them into one recommended edit list." : "Run AGATHA and BERDINE first, ANA only synthesises recorded reviews."} render={(o, r) => <SynthesisView o={o} run={r} ctx={ctx} />} />

              <MyDecision draft={draft} cur={cur} reload={load} reviews={{ ag: ag.latest, be: be.latest }} />
              <div className="border-2 border-chocolate p-5 bg-paper flex flex-wrap items-center justify-between gap-4" data-testid="apply-bar">
                <p className="font-mono text-xs">{accepted.length} accepted · {rejected.length} rejected</p>
                <Btn variant="accent" data-testid="apply-accepted-btn" disabled={!accepted.length || text !== cur.text} onClick={applyAccepted}>Apply accepted → save v{cur.n + 1}</Btn>
              </div>

              {draft.versions.length > 1 && <div><Kicker><GitCompare className="w-3 h-3 inline mr-1" />Before / after</Kicker><Compare versions={draft.versions} key={draft.versions.length} /></div>}
              <div>
                <Kicker>Version history</Kicker>
                {draft.versions.slice().reverse().map((v) => (
                  <div key={v.n} className="flex justify-between gap-3 py-2 border-b border-chocolate/20 font-mono text-xs">
                    <span><span className="text-tangelo mr-3">v{v.n}</span>{v.note} {v.accepted?.length ? `· ${v.accepted.length} accepted` : ""}{v.rejected?.length ? ` · ${v.rejected.length} rejected` : ""}</span>
                    <span className="text-chocolate/60 shrink-0">{fmtDate(v.created_at)} · <button className="text-tangelo underline-grow" onClick={() => setText(v.text)}>load</button></span>
                  </div>
                ))}
              </div>

              <div className="bg-chocolate text-linen p-6" data-testid="approval-step">
                <p className="kicker text-botticelli mb-2">Final human decision</p>
                <p className="font-display uppercase text-3xl mb-1">Status: <span data-testid="draft-status" className="text-tangelo">{draft.status.replace("_", " ")}</span></p>
                <p className="font-mono text-xs text-linen/70 mb-4">No publishing integration is configured. Nothing is published by the app, "published" only records that you published it yourself.</p>
                <div className="flex flex-wrap gap-2">
                  <Btn variant="lineDark" data-testid="status-in-review" onClick={() => setStatus("in_review", "Marked in review")}>In review</Btn>
                  <Btn variant="lineDark" data-testid="status-approved" onClick={() => setStatus("approved", "Approved")}>Approve v{cur.n}</Btn>
                  <Btn variant="lineDark" data-testid="status-rejected" onClick={() => setStatus("rejected", "Rejected")}>Reject</Btn>
                  <Btn variant="accent" data-testid="status-published" onClick={() => window.confirm("Record that YOU published this manually? The app does not publish.") && setStatus("published_manually", "Recorded as published manually")}>I published it</Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
