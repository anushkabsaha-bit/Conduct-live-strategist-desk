import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ExternalLink, ArrowRight } from "lucide-react";
import { RunView } from "./AgentRunCard";
import { useRuns } from "./useRuns";
import { create } from "../lib/api";
import { Claim } from "./Output";

const EXAMPLE = "Hi ANA, can you see what's happening with this opportunity? I think there might be a story here, but I'm not sure what the strongest angle is yet.";

const contextText = (title, o, msg) => [
  `From ANA, about: ${o.about || title}`, `My question: ${msg}`, `ANA said: ${o.reply}`,
  "Facts in saved records:", ...(o.facts || []).map((f) => `- ${f.point} [${f.source}]`),
  "Assumptions:", ...(o.assumptions || []).map((a) => `- ${a}`),
  "Possible directions:", ...(o.directions || []).map((d) => `- ${d.title}: ${d.why_it_matters} (check with: ${d.verify_with})`),
  `Suggested next step: ${o.next_step?.step || ""}`, "Sources:", ...(o.sources || []).filter(Boolean).map((s) => `- ${s}`),
].join("\n");

function Continue({ o, run, title }) {
  const nav = useNavigate();
  const msg = run.input?.message || "";
  const go = async (where) => {
    const ctx = contextText(title, o, msg).slice(0, 4000);
    const name = `${title}: ${o.directions?.[0]?.title || "story angle"}`.slice(0, 120);
    if (where === "content") {
      const d = await create("drafts", { title: name, format: "LinkedIn post", audience: "", objective: o.next_step?.why || "", word_limit: null, status: "draft", brief: { subject: name, source_material: ctx, ana_run: run.id }, versions: [{ n: 1, text: "", note: "Handed over from ANA", source: "handoff", created_at: new Date().toISOString() }] });
      nav(`/content?draft=${d.id}`);
    } else if (where === "campaign") {
      const c = await create("campaigns", { name, status: "draft", event: o.about || title, provenance: "Started from an ANA conversation. Not approved.", decision: "", context: ctx, ana_run: run.id });
      nav(`/campaigns?id=${c.id}`);
    } else {
      const w = await create("workspaces", { room: "narrative", name, status: "Draft", data: {}, label: "Handed over from ANA with recorded context", links: [{ room: "ana", id: run.id }], context: ctx });
      nav(`/narrative?id=${w.id}`);
    }
    toast.success("Context handed over. Nothing was decided for you.");
  };
  return (
    <div className="flex flex-wrap gap-2 pt-3 border-t border-linen/20" data-testid="ana-continue">
      <span className="kicker text-botticelli self-center mr-1">Continue in</span>
      {[["narrative", "Narrative"], ["campaign", "Campaign"], ["content", "Content Desk"]].map(([k, l]) => (
        <button key={k} data-testid={`ana-continue-${k}`} onClick={() => go(k)} className={`font-mono text-[10px] uppercase tracking-[0.14em] px-3 py-2 border transition-colors inline-flex items-center gap-1 ${o.next_step?.workspace === k ? "bg-tangelo border-tangelo text-linen" : "border-linen/40 hover:border-tangelo"}`}>{l}<ArrowRight className="w-3 h-3" /></button>
      ))}
    </div>
  );
}

const Reply = ({ o, run, title }) => (
  <div className="space-y-5" data-testid="ana-reply">
    <p className="font-mono text-[10px] text-linen/50">You asked: "{run.input?.message}"</p>
    <p className="font-serifit text-xl leading-snug"><Claim text={o.reply} /></p>
    {o.clarifying_question && <p className="border-l-4 border-tangelo pl-3 font-mono text-sm" data-testid="ana-clarifying">{o.clarifying_question}</p>}
    <div className="grid md:grid-cols-2 gap-5">
      <div><p className="kicker text-botticelli mb-2">Facts from saved records</p>{(o.facts || []).map((f, i) => <p key={i} className="font-mono text-xs py-1 border-b border-linen/10">{f.point} <span className="text-linen/50">[{/^https?:/.test(f.source) ? <a href={f.source} target="_blank" rel="noreferrer" className="text-tangelo underline-grow">{f.source}</a> : f.source}]</span></p>)}</div>
      <div><p className="kicker text-botticelli mb-2">Assumptions</p>{(o.assumptions || []).map((a, i) => <p key={i} className="font-mono text-xs py-1 border-b border-linen/10 text-linen/80">{a}</p>)}</div>
    </div>
    <div className="grid md:grid-cols-3 gap-3" data-testid="ana-directions">{(o.directions || []).map((d, i) => <div key={i} className="border border-linen/25 p-3"><p className="font-display uppercase text-lg leading-none mb-2">{d.title}</p><p className="font-mono text-[11px] leading-relaxed">{d.why_it_matters}</p><p className="font-mono text-[10px] text-botticelli mt-2">Check with: {d.verify_with}</p></div>)}</div>
    {o.next_step?.step && <p className="font-mono text-xs"><span className="kicker text-tangelo">A useful next step · </span>{o.next_step.step} <span className="text-linen/60">{o.next_step.why}</span></p>}
    {(o.sources || []).filter(Boolean).length > 0 && <div className="font-mono text-[11px]">{o.sources.filter(Boolean).map((s, i) => /^https?:/.test(s) ? <a key={i} href={s} target="_blank" rel="noreferrer" className="block text-tangelo underline-grow truncate"><ExternalLink className="w-3 h-3 inline mr-1" />{s}</a> : <p key={i} className="text-linen/60">{s}</p>)}</div>}
    <Continue o={o} run={run} title={title} />
  </div>
);

export default function AskAna({ refType, refId, title }) {
  const hook = useRuns("ana.ask", refType, refId);
  const [msg, setMsg] = useState("");
  return (
    <div className="space-y-3" data-testid="ask-ana">
      <textarea data-testid="ask-ana-input" className="field-dark min-h-[80px]" placeholder={EXAMPLE} value={msg} onChange={(e) => setMsg(e.target.value)} />
      <RunView dark agent="ana" task="ana.ask" testid="ask-ana" label={`Ask ANA about ${title}`} hook={hook}
        getInput={() => ({ message: msg.trim() || EXAMPLE })}
        hint="Write in plain language. ANA reads this record, any CATHERINE research with its links, and your saved desk. Nothing is decided or sent for you."
        render={(o, r) => <Reply o={o} run={r} title={title} />} />
    </div>
  );
}
