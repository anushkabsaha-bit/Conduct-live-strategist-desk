import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { AgentChip, Btn, Field, Tag } from "./kit";
import { create, remove, update } from "../lib/api";
import { AGENTS, AGENT_IDS, CATEGORIES } from "../lib/meta";

const BLANK = { title: "", date: "", start: "09:00", end: "10:00", category: "planning", purpose: "", participants: "", prep_notes: "", status: "planned", related: "", agents: [], recurrence: "none", illustrative: false };

export default function BlockDialog({ block, open, onClose, onSaved }) {
  const [f, setF] = useState(BLANK);
  const nav = useNavigate();
  useEffect(() => { if (open) setF({ ...BLANK, ...(block || {}) }); }, [open, block]);
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleAgent = (a) => setF({ ...f, agents: f.agents.includes(a) ? f.agents.filter((x) => x !== a) : [...f.agents, a] });
  const save = async () => {
    if (f.id) await update("calendar", f.id, f); else await create("calendar", f);
    toast.success("Calendar block saved"); onSaved(); onClose();
  };
  const del = async () => { await remove("calendar", f.id); toast.success("Block deleted"); onSaved(); onClose(); };
  const startWork = (agent) => {
    const msg = encodeURIComponent(`Preparing for "${f.title}" (${f.date} ${f.start}). Purpose: ${f.purpose}. Prep notes: ${f.prep_notes || "none"}. Help me prepare.`);
    nav(agent ? `/agents?agent=${agent}&prefill=${msg}&ref_type=block&ref_id=${f.id}` : CATEGORIES[f.category]?.to || "/");
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="block-dialog" className="bg-linen text-chocolate border-2 border-chocolate rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display uppercase text-3xl">{f.id ? "Work block" : "New work block"}</DialogTitle><DialogDescription className="sr-only">Edit details</DialogDescription></DialogHeader>
        {f.illustrative && <Tag tone="blue" className="w-fit">Illustrative, not a confirmed meeting</Tag>}
        {f.id && (
          <div className="border-2 border-chocolate p-4 bg-paper" data-testid="block-start-work">
            <p className="kicker text-tangelo mb-2">Start the work</p>
            <div className="flex flex-wrap gap-2">
              {f.agents.map((a) => <Btn key={a} data-testid={`block-open-${a}`} onClick={() => startWork(a)} style={{ background: AGENTS[a].color }} className="!text-linen">Open {AGENTS[a].name} <ArrowUpRight className="w-3.5 h-3.5" /></Btn>)}
              <Btn variant="line" data-testid="block-open-workspace" onClick={() => startWork(null)}>Open workspace</Btn>
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><Field label="Title"><input data-testid="block-title-input" className="field" value={f.title} onChange={s("title")} /></Field></div>
          <Field label="Date"><input data-testid="block-date-input" type="date" className="field" value={f.date} onChange={s("date")} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Start"><input data-testid="block-start-input" type="time" className="field" value={f.start} onChange={s("start")} /></Field>
            <Field label="End"><input data-testid="block-end-input" type="time" className="field" value={f.end} onChange={s("end")} /></Field>
          </div>
          <Field label="Category"><select data-testid="block-category-select" className="field" value={f.category} onChange={s("category")}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
          <Field label="Status"><select data-testid="block-status-select" className="field" value={f.status} onChange={s("status")}>{["planned", "in_progress", "done", "cancelled"].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Repeats"><select data-testid="block-recurrence-select" className="field" value={f.recurrence} onChange={s("recurrence")}><option value="none">Does not repeat</option><option value="weekly">Weekly (same weekday)</option></select></Field>
          <Field label="Participants (optional)"><input className="field" value={f.participants} onChange={s("participants")} placeholder="Only confirmed people" /></Field>
          <div className="md:col-span-2"><Field label="Purpose"><textarea className="field" rows={2} value={f.purpose} onChange={s("purpose")} /></Field></div>
          <div className="md:col-span-2"><Field label="Preparation notes"><textarea data-testid="block-prep-input" className="field" rows={2} value={f.prep_notes} onChange={s("prep_notes")} /></Field></div>
          <div className="md:col-span-2"><Field label="Related projects or content"><input className="field" value={f.related} onChange={s("related")} /></Field></div>
          <div className="md:col-span-2">
            <span className="kicker block mb-2 text-tangelo">Agents to consult</span>
            <div className="flex flex-wrap gap-2">{AGENT_IDS.map((a) => (
              <button key={a} type="button" data-testid={`block-agent-${a}`} onClick={() => toggleAgent(a)} className={`transition-opacity ${f.agents.includes(a) ? "opacity-100" : "opacity-35 hover:opacity-70"}`}><AgentChip id={a} /></button>
            ))}</div>
          </div>
        </div>
        <div className="flex justify-between pt-2">
          {f.id ? <Btn variant="ghost" data-testid="block-delete-btn" onClick={del}><Trash2 className="w-3.5 h-3.5" />Delete</Btn> : <span />}
          <Btn variant="accent" data-testid="block-save-btn" onClick={save} disabled={!f.title || !f.date}>Save block</Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
