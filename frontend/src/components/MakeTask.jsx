import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { ListPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Btn, Field } from "./kit";
import { create, list } from "../lib/api";
import { AGENTS, AGENT_IDS } from "../lib/meta";

export default function MakeTask({ title, agent, why, nextAction, context, dark, testid = "make-task", label = "Make task" }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({});
  const [blocks, setBlocks] = useState([]);
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    if (!open) return;
    setF({ title: title || "", agent: agent || "ana", due: "", why: why || "", next_action: nextAction || "", block_id: "", project_id: "" });
    list("calendar").then(setBlocks); list("projects").then(setProjects);
  }, [open, title, agent, why, nextAction]);
  const save = async () => {
    await create("tasks", { ...f, importance: "medium", kind: "follow_up", status: "open", illustrative: false, context: context || {} });
    toast.success("Task created with its original context");
    setOpen(false);
  };
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <button data-testid={testid} onClick={() => setOpen(true)} className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase underline-grow ${dark ? "text-botticelli" : "text-tangelo"}`}>
        <ListPlus className="w-3.5 h-3.5" />{label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-linen text-chocolate border-2 border-chocolate rounded-none max-w-lg">
          <DialogHeader><DialogTitle className="font-display uppercase text-2xl">Turn into a task</DialogTitle><DialogDescription className="sr-only">Edit details</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Field label="Task"><input data-testid="task-title-input" className="field" value={f.title || ""} onChange={s("title")} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Agent / owner"><select className="field" value={f.agent} onChange={s("agent")}>{AGENT_IDS.map((a) => <option key={a} value={a}>{AGENTS[a].name}</option>)}<option value="anushka">Anushka</option></select></Field>
              <Field label="Due"><input type="date" className="field" value={f.due || ""} onChange={s("due")} /></Field>
            </div>
            <Field label="Why it matters"><textarea className="field" rows={2} value={f.why || ""} onChange={s("why")} /></Field>
            <Field label="Next action"><input className="field" value={f.next_action || ""} onChange={s("next_action")} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Link to calendar block"><select data-testid="task-block-select" className="field" value={f.block_id} onChange={s("block_id")}><option value="">None</option>{blocks.map((b) => <option key={b.id} value={b.id}>{`${b.date} · ${b.title}`}</option>)}</select></Field>
              <Field label="Link to project"><select className="field" value={f.project_id} onChange={s("project_id")}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            </div>
            <p className="font-mono text-[10px] text-chocolate/60">The source context (agent run, rationale, links) is saved with the task.</p>
            <Btn data-testid="task-save-btn" variant="accent" onClick={save} disabled={!f.title}>Save task</Btn>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
