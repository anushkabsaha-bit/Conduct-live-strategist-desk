import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Check, X, GitCompare, Send } from "lucide-react";
import { AgentChip, Btn, Empty, Field, Kicker, Note, PageHead, Tag } from "../components/kit";
import { Claim, Output, PostChip } from "../components/Output";
import { RunView } from "../components/AgentRunCard";
import { useRuns } from "../components/useRuns";
import { create, http, list, recordDecision, update } from "../lib/api";
import { fmtDate } from "../lib/meta";

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
  const sel = (v, set) => <select className="field !w-auto" value={v} onChange={(e) => set(+e.target.value)}>{versions.map((x, i) => <option key={i} value={i}>v{x.n} · {x.note || x.source}</option>)}</select>;
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

function AgathaView({ o, run, ctx }) {
  return (
    <div className="space-y-6">
      <p className="font-serifit italic text-xl leading-snug"><Claim text={o.headline} /></p>
      <div className="flex flex-wrap gap-2"><Tag tone="dark">Confidence: {o.confidence}</Tag><Tag tone="blue">Word limit: {o.word_limit_check}</Tag></div>
      <p className="font-mono text-[11px] text-chocolate/70">{o.confidence_reason}</p>
      <div>
        <p className="kicker text-tangelo mb-2">Key observations</p>
        {(o.observations || []).map((x, i) => (
          <div key={i} className="py-2 border-b border-chocolate/15 font-mono text-xs leading-relaxed">
            <Tag tone={x.label === "DATASET" ? "blue" : x.label === "HYPOTHESIS" ? "line" : "dark"} className="mr-2">{x.label}</Tag><Claim text={x.point} /> {(x.evidence_post_ids || []).filter((p) => !x.point.includes(p)).map((p) => <PostChip key={p} id={p} />)}
          </div>
        ))}
      </div>
      <div><p className="kicker text-tangelo mb-2">Suggested edits</p><Suggestions edits={o.edits} runId={run.id} from="agatha" {...ctx} /></div>
      <div>
        <p className="kicker text-tangelo mb-2">Alternative openings</p>
        {(o.alternative_openings || []).map((x, i) => (
          <div key={i} className={`p-3 mb-2 border ${i === o.preferred_opening ? "border-tangelo bg-tangelo/10" : "border-chocolate/30"}`}>
            {i === o.preferred_opening && <Tag tone="solid" className="mb-2">AGATHA prefers</Tag>}
            <p className="font-mono text-sm">{x.text}</p><p className="font-mono text-[11px] italic text-chocolate/70 mt-1"><Claim text={x.why} /></p>
          </div>
        ))}
      </div>
      <div data-testid="agatha-relevant-posts">
        <p className="kicker text-tangelo mb-2">Historical posts that informed this (click to inspect)</p>
        {(o.relevant_posts || []).map((p) => <p key={p.post_id} className="font-mono text-xs mb-1.5"><PostChip id={p.post_id} /> <Claim text={p.why_relevant} /></p>)}
      </div>
      <Output data={{ performance_view: o.performance_view, what_remains_a_hypothesis: o.hypotheses, recommended_experiment: o.experiment }} />
    </div>
  );
}

function BerdineView({ o, run, ctx }) {
  const [tab, setTab] = useState("minimal_edit");
  return (
    <div className="space-y-6">
      <p className="font-serifit italic text-xl leading-snug"><Claim text={o.headline} /></p>
      <Tag tone="blue">{o.voice_profile_note || "Inferred voice profile — no internal style guide supplied"}</Tag>
      <Output data={{ what_sounds_right: o.what_works, inconsistent_with_voice: o.inconsistent_with_voice, unclear_or_jargon: o.unclear_or_jargon, audience_fit: o.audience_fit, cut: o.cut, keep: o.keep, uk_vs_us: o.uk_us_notes }} />
      <div><p className="kicker text-tangelo mb-2">Line edits</p><Suggestions edits={o.edits} runId={run.id} from="berdine" {...ctx} /></div>
      <div>
        <div className="flex flex-wrap gap-1 mb-2">{["minimal_edit", "stronger_rewrite", "unconventional_version"].map((k) => <button key={k} data-testid={`berdine-tab-${k}`} onClick={() => setTab(k)} className={`font-mono text-[10px] tracking-[0.14em] uppercase px-3 py-1.5 border ${tab === k ? "bg-chocolate text-linen border-chocolate" : "border-chocolate/40"}`}>{k.replace(/_/g, " ")}</button>)}</div>
        <p className="font-mono text-sm whitespace-pre-wrap bg-linen border border-chocolate/30 p-4">{o[tab]}</p>
        <button data-testid="berdine-use-version" onClick={() => ctx.loadText(o[tab], `BERDINE ${tab.replace(/_/g, " ")}`)} className="font-mono text-[10px] tracking-[0.14em] uppercase text-tangelo underline-grow mt-2">Load into editor (save to keep)</button>
      </div>
      <Output data={{ most_important_edits: o.most_important_edits, flag_for_diana: o.flag_for_diana }} />
    </div>
  );
}

function SynthesisView({ o, run, ctx }) {
  return (
    <div className="space-y-6">
      <p className="font-serifit italic text-xl leading-snug"><Claim text={o.summary} /></p>
      <Output data={{ agreements: o.agreements, conflicts: o.conflicts }} />
      <div><p className="kicker text-tangelo mb-2">Recommended edits — accept or reject each</p><Suggestions edits={o.recommended_edits} runId={run.id} from="ana" {...ctx} /></div>
      <Output data={{ outstanding_concerns: o.outstanding_concerns, next_step: o.next_step }} />
    </div>
  );
}

export default function ContentDesk() {
  const [drafts, setDrafts] = useState([]);
  const [id, setId] = useState(null);
  const [text, setText] = useState("");
  const [choice, setChoice] = useState({});
  const [routed, setRouted] = useState(false);
  const load = useCallback(async () => { const d = await list("drafts"); setDrafts(d); setId((cur) => cur || d[0]?.id); return d; }, []);
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
    toast.success("Saved as a new version — the original is kept"); load();
  };
  const accepted = Object.keys(choice).filter((k) => !k.endsWith("#e") && choice[k] === "accepted");
  const rejected = Object.keys(choice).filter((k) => !k.endsWith("#e") && choice[k] === "rejected");
  const applyAccepted = async () => {
    let t = text, miss = 0;
    accepted.forEach((k) => { const e = choice[`${k}#e`]; if (t.includes(e.before)) t = t.replace(e.before, e.after); else miss++; });
    await saveVersion(t, `Applied ${accepted.length - miss} accepted suggestion(s)`, { source: "accepted_suggestions", accepted: accepted.map((k) => choice[`${k}#e`]), rejected: rejected.map((k) => choice[`${k}#e`]) });
    if (miss) toast.warning(`${miss} accepted edit(s) could not be applied automatically — the text had changed.`);
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
                  <Btn data-testid="save-version-btn" onClick={() => saveVersion(text, "Manual edit")} disabled={text === cur.text}><Save className="w-3.5 h-3.5" />Save as v{cur.n + 1}</Btn>
                </div>
                <textarea data-testid="draft-editor" className="field !text-base leading-relaxed min-h-[280px] spotlight" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste or write your draft…" />
              </div>

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
              <RunView agent="ana" task="ana.synthesis" label="Synthesis" hook={syn} version={cur.n} hint={both ? "Both reviews exist. Ask ANA to synthesise them into one recommended edit list." : "Run AGATHA and BERDINE first — ANA only synthesises recorded reviews."} render={(o, r) => <SynthesisView o={o} run={r} ctx={ctx} />} />

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
                <p className="font-mono text-xs text-linen/70 mb-4">No publishing integration is configured. Nothing is published by the app — "published" only records that you published it yourself.</p>
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
