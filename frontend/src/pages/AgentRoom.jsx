import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Send, FileText, Trash2, Flag, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { AgentChip, Btn, Empty, Field, Kicker, Note, PageHead, Tag } from "../components/kit";
import { Markdown, Output } from "../components/Output";
import MakeTask from "../components/MakeTask";
import { create, http, list, listRuns, streamChat } from "../lib/api";
import { AGENTS, AGENT_IDS, fmtDate } from "../lib/meta";

const REF_TYPES = { draft: ["drafts", "title"], story: ["stories", "title"], campaign: ["campaigns", "name"], opportunity: ["opportunities", "name"], project: ["projects", "name"], block: ["calendar", "title"] };

function PromptDialog({ agent, open, onClose }) {
  const [d, setD] = useState(null);
  const [rev, setRev] = useState("");
  useEffect(() => { if (open) http.get(`/agents/${agent}/prompt`).then((r) => { setD(r.data); setRev(r.data.revisions.find((x) => x.active)?.text || ""); }); }, [open, agent]);
  const save = async () => { await http.post(`/agents/${agent}/revisions`, { text: rev }); toast.success(rev ? "Revision saved, the original stays untouched" : "Revision cleared"); onClose(); };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="prompt-dialog" className="bg-linen text-chocolate border-2 border-chocolate rounded-none max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display uppercase text-3xl">{AGENTS[agent].name} · prompt registry</DialogTitle><DialogDescription className="sr-only">Edit details</DialogDescription></DialogHeader>
        {!d ? <p className="font-mono text-xs">Loading…</p> : (
          <div className="space-y-6">
            <div><div className="flex gap-2 items-center mb-2"><Tag tone="dark">Original · read-only</Tag><span className="font-mono text-[10px]">{d.original.length.toLocaleString()} chars, verbatim from your supplied prompt</span></div>
              <pre data-testid="prompt-original" className="whitespace-pre-wrap font-mono text-[11px] bg-paper border border-chocolate/30 p-4 max-h-72 overflow-auto">{d.original}</pre></div>
            <div><Tag tone="blue" className="mb-2">Application layer · added by the app</Tag>
              <pre className="whitespace-pre-wrap font-mono text-[11px] bg-paper border border-chocolate/30 p-4 max-h-56 overflow-auto">{d.application_layer}</pre></div>
            <div><Tag tone="solid" className="mb-2">Your revision · stored separately</Tag>
              <textarea data-testid="prompt-revision-input" className="field" rows={5} value={rev} onChange={(e) => setRev(e.target.value)} placeholder="Optional instructions layered on top of the original. Leave empty to use the original only." />
              {d.revisions.length > 0 && <p className="font-mono text-[10px] text-chocolate/60 mt-1">{d.revisions.length} revision(s) on record · latest {fmtDate(d.revisions[0].created_at)}</p>}
              <Btn variant="accent" className="mt-3" data-testid="prompt-revision-save" onClick={save}>Save revision</Btn></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Msg({ m, agent, onHandoff, refCtx }) {
  const [to, setTo] = useState("");
  const flag = async () => {
    await create("tasks", { title: `Missing info flagged in ${AGENTS[agent].name} conversation`, agent, due: "", importance: "medium", kind: "follow_up", status: "open", why: m.text.slice(0, 400), next_action: "Find the missing information", context: { message_id: m.id, ...refCtx } });
    toast.success("Flagged as a follow-up task");
  };
  if (m.role === "user") return <div className="flex justify-end"><div className="max-w-[80%] bg-chocolate text-linen p-4 font-mono text-sm whitespace-pre-wrap">{m.handoff_from && <Tag tone="blue" className="mb-2">Handoff from {AGENTS[m.handoff_from]?.name}</Tag>}{m.text}</div></div>;
  return (
    <div className="max-w-[92%]" data-testid="assistant-message">
      <div className="bg-paper border-2 p-4 font-mono text-sm leading-relaxed" style={{ borderColor: AGENTS[agent].color }}><Markdown text={m.text} /></div>
      {m.id && (
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <span className="font-mono text-[10px] text-chocolate/50">{fmtDate(m.created_at)}</span>
          <span className="flex items-center gap-1"><Share2 className="w-3 h-3 text-tangelo" />
            <select data-testid="handoff-select" className="font-mono text-[10px] uppercase tracking-[0.12em] bg-transparent text-tangelo" value={to} onChange={(e) => { setTo(""); e.target.value && onHandoff(e.target.value, m); }}>
              <option value="">Hand to…</option>{AGENT_IDS.filter((a) => a !== agent).map((a) => <option key={a} value={a}>{AGENTS[a].name}</option>)}
            </select></span>
          <button data-testid="flag-missing-btn" onClick={flag} className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.14em] uppercase text-tangelo underline-grow"><Flag className="w-3 h-3" />Flag missing info</button>
          <MakeTask title={`Follow up: ${AGENTS[agent].name} recommendation`} agent={agent} why={m.text.slice(0, 300)} context={{ message_id: m.id, agent, ...refCtx }} />
        </div>
      )}
    </div>
  );
}

export default function AgentRoom() {
  const [params, setParams] = useSearchParams();
  const agent = AGENT_IDS.includes(params.get("agent")) ? params.get("agent") : "ana";
  const [meta, setMeta] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [refType, setRefType] = useState(params.get("ref_type") || "");
  const [refId, setRefId] = useState(params.get("ref_id") || "");
  const [refItems, setRefItems] = useState([]);
  const [findings, setFindings] = useState([]);
  const [promptOpen, setPromptOpen] = useState(false);
  const [handoffFrom, setHandoffFrom] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { http.get("/agents").then((r) => setMeta(r.data)); }, []);
  const loadMsgs = useCallback(() => http.get(`/agents/${agent}/messages`).then((r) => setMsgs(r.data)), [agent]);
  useEffect(() => { loadMsgs(); }, [loadMsgs]);
  useEffect(() => { const p = params.get("prefill"); if (p) setInput(p); setHandoffFrom(params.get("from") || null); }, [params]);
  useEffect(() => { if (refType) list(REF_TYPES[refType][0]).then(setRefItems); else setRefItems([]); }, [refType]);
  useEffect(() => { if (refType && refId) listRuns({ ref_type: refType, ref_id: refId }).then(setFindings); else setFindings([]); }, [refType, refId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [msgs]);

  const pick = (a) => setParams({ agent: a, ...(refType && refId ? { ref_type: refType, ref_id: refId } : {}) });
  const send = async () => {
    const text = input.trim(); if (!text) return;
    setBusy(true); setInput("");
    setMsgs((m) => [...m, { role: "user", text, handoff_from: handoffFrom }, { role: "assistant", text: "" }]);
    try {
      await streamChat(agent, { message: text, ref_type: refType || null, ref_id: refId || null, handoff_from: handoffFrom }, (d) => setMsgs((m) => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], text: c[c.length - 1].text + d }; return c; }));
      setHandoffFrom(null); await loadMsgs();
    } catch (e) {
      toast.error(e.message); setMsgs((m) => m.slice(0, -1)); setInput(text);
    } finally { setBusy(false); }
  };
  const handoff = async (to, m) => {
    await create("handoffs", { from_agent: agent, to_agent: to, message_id: m.id, excerpt: m.text.slice(0, 1500), ref_type: refType, ref_id: refId });
    const prefill = `Handoff from ${AGENTS[agent].name} (recorded): "${m.text.slice(0, 1200)}"\n\nPlease take this forward from your side.`;
    setParams({ agent: to, prefill, from: agent, ...(refType && refId ? { ref_type: refType, ref_id: refId } : {}) });
    toast.success(`Handoff to ${AGENTS[to].name} recorded, review and send`);
  };
  const clear = async () => { if (!window.confirm(`Clear ${AGENTS[agent].name}'s conversation history?`)) return; await http.delete(`/agents/${agent}/messages`); loadMsgs(); };
  const m = meta.find((x) => x.id === agent);
  const a = AGENTS[agent];

  return (
    <div>
      <PageHead n="06" kicker="Agent Room" title="Six colleagues" accent=". One desk." sub="They surface things. They challenge things. They help connect the dots. Anushka decides what actually ships." />
      <section className="bg-linen text-chocolate px-5 md:px-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 border-t border-l border-chocolate/30" data-testid="agent-tiles">
          {AGENT_IDS.map((id) => {
            const x = meta.find((y) => y.id === id);
            return (
              <button key={id} data-testid={`agent-tile-${id}`} onClick={() => pick(id)} className={`text-left p-5 border-r border-b border-chocolate/30 transition-colors duration-300 ${id === agent ? "text-linen" : "hover:bg-paper"}`} style={{ background: id === agent ? AGENTS[id].color : undefined, borderTop: `5px solid ${AGENTS[id].color}` }}>
                <p className="font-display uppercase text-2xl leading-none">{AGENTS[id].name}</p>
                <p className="font-mono text-[10px] tracking-[0.12em] uppercase mt-2 opacity-80">{AGENTS[id].title}</p>
                {x?.has_revision && <span className="font-hand text-sm">revised prompt</span>}
              </button>
            );
          })}
        </div>
      </section>
      <section className="bg-linen text-chocolate px-5 md:px-10 pb-16">
        <div className="grid lg:grid-cols-[320px_1fr] gap-8 mt-6">
          <aside className="space-y-6">
            <div className="p-5 text-linen" style={{ background: a.color }} data-testid="agent-profile">
              <p className="font-display uppercase text-4xl leading-none">{a.name}</p>
              <p className="kicker mt-2 opacity-80">{a.title}</p>
              <p className="font-serifit italic text-lg mt-4 leading-snug">{m?.summary}</p>
              <ul className="mt-4 space-y-1">{(m?.can || []).map((c) => <li key={c} className="font-mono text-[11px]">→ {c}</li>)}</ul>
              <button data-testid="view-prompt-btn" onClick={() => setPromptOpen(true)} className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] uppercase border border-linen/60 px-3 py-2 hover:bg-linen hover:text-chocolate transition-colors"><FileText className="w-3.5 h-3.5" />Original prompt & layers</button>
            </div>
            <div data-testid="shared-context">
              <p className="kicker text-tangelo mb-2">Shared project context</p>
              <div className="space-y-2">
                <select data-testid="ref-type-select" className="field" value={refType} onChange={(e) => { setRefType(e.target.value); setRefId(""); }}><option value="">No linked record</option>{Object.keys(REF_TYPES).map((k) => <option key={k} value={k}>{k}</option>)}</select>
                {refType && <select data-testid="ref-id-select" className="field" value={refId} onChange={(e) => setRefId(e.target.value)}><option value="">Choose…</option>{refItems.map((it) => <option key={it.id} value={it.id}>{it[REF_TYPES[refType][1]]}</option>)}</select>}
              </div>
              <Note className="mt-2">Every agent sees the linked record and the findings recorded on it, so work survives switching agents.</Note>
              {refId && (
                <div className="mt-4 space-y-2">
                  <p className="kicker text-tangelo">Recorded findings on this record ({findings.length})</p>
                  {findings.length ? findings.map((r) => (
                    <details key={r.id} className="border border-chocolate/30 bg-paper p-2">
                      <summary className="cursor-pointer font-mono text-[11px] flex items-center gap-2"><AgentChip id={r.agent} />{r.task.split(".")[1].replace("_", " ")} · {fmtDate(r.created_at)}</summary>
                      <div className="mt-2 max-h-80 overflow-auto"><Output data={r.output} /></div>
                    </details>
                  )) : <Note>No completed analysis on this record yet.</Note>}
                </div>
              )}
            </div>
          </aside>
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center justify-between mb-3"><Kicker>Conversation with {a.name}</Kicker><Btn variant="ghost" data-testid="clear-chat-btn" onClick={clear}><Trash2 className="w-3.5 h-3.5" />Clear</Btn></div>
            <div className="space-y-5 min-h-[300px] max-h-[640px] overflow-y-auto scroll-thin pr-2" data-testid="chat-log">
              {!msgs.length && <Empty title={`Ask ${a.name} something.`}>Her own history is saved here. Link a record on the left to share project context.</Empty>}
              {msgs.map((x, i) => <Msg key={x.id || i} m={x} agent={agent} onHandoff={handoff} refCtx={{ ref_type: refType, ref_id: refId }} />)}
              {busy && msgs[msgs.length - 1]?.text === "" && <p className="font-hand text-xl animate-pulse">{a.name} is thinking…</p>}
              <div ref={endRef} />
            </div>
            <div className="mt-4 border-2 border-chocolate bg-paper p-3">
              {handoffFrom && <Tag tone="blue" className="mb-2">Handoff from {AGENTS[handoffFrom]?.name}</Tag>}
              <Field label={`Message ${a.name}`}><textarea data-testid="chat-input" className="field !border-0 !bg-transparent min-h-[90px]" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} placeholder="⌘/Ctrl + Enter to send" /></Field>
              <div className="flex justify-end"><Btn variant="accent" data-testid="chat-send-btn" onClick={send} loading={busy} disabled={!input.trim()}><Send className="w-3.5 h-3.5" />Send</Btn></div>
            </div>
          </div>
        </div>
      </section>
      <PromptDialog agent={agent} open={promptOpen} onClose={() => setPromptOpen(false)} />
    </div>
  );
}
