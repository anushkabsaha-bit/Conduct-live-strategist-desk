import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { copyDraft } from "../lib/api";
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react";
import { LABELS } from "../lib/strategy";

export const LabelChip = ({ label, className = "" }) => {
  const l = LABELS[label] || LABELS.interpretation;
  return <span data-testid={`label-${label}`} className={`inline-block px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] uppercase whitespace-nowrap ${l.c} ${className}`}>{l.t}</span>;
};

export const Cite = ({ ids = [], sources = [] }) => {
  const [open, setOpen] = useState(null);
  if (!ids.length) return <span className="font-mono text-[10px] text-chocolate/50">No source: my own framing</span>;
  const s = sources.find((x) => x.id === open);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {ids.map((id) => <button key={id} data-testid={`cite-${id}`} onClick={() => setOpen(open === id ? null : id)} className={`font-mono text-[10px] px-1.5 border transition-colors ${open === id ? "bg-chocolate text-linen border-chocolate" : "border-chocolate/40 hover:border-tangelo hover:text-tangelo"}`}>{id}</button>)}
      {s && <SourceCard s={s} />}
    </span>
  );
};

export const SourceCard = ({ s }) => (
  <span className="block w-full mt-2 p-3 bg-paper border-l-4 border-botticelli text-chocolate" data-testid={`source-card-${s.id}`}>
    <a href={s.url} target="_blank" rel="noreferrer" className="font-mono text-[11px] font-bold hover:text-tangelo inline-flex items-center gap-1">{s.id} · {s.title}<ExternalLink className="w-3 h-3" /></a>
    <span className="block font-mono text-[11px] mt-1 leading-relaxed">{s.supports}</span>
    <span className="block font-mono text-[10px] italic opacity-60 mt-1">{s.check_note}</span>
  </span>
);

export const StrategyTabs = () => {
  const tabs = [["/writing", "The writing", "01"], ["/strategy/film", "The customer story", "02"], ["/score", "SAP Score", "03"], ["/strategy/brief", "Campaign brief", "04"], ["/strategy/measure", "Did it work?", "05"], ["/strategy/narrative", "Narrative & evidence", "+"], ["/strategy", "Overview", "+"]];
  return (
    <div className="sticky top-14 z-40 bg-ink border-b border-linen/15 px-5 md:px-10 flex gap-0 overflow-x-auto scroll-thin" data-testid="strategy-tabs">
      {tabs.map(([to, l, n]) => (
        <NavLink key={to} to={to} end data-testid={`strategy-tab-${to.split("/").pop() || "home"}`} className={({ isActive }) => `shrink-0 px-4 py-3 font-mono text-[10px] tracking-[0.16em] uppercase border-b-2 transition-colors ${isActive ? "border-tangelo text-linen" : "border-transparent text-linen/50 hover:text-linen"}`}>
          <span className="text-tangelo mr-2">{n}</span>{l}
        </NavLink>
      ))}
    </div>
  );
};

export const Section = ({ id, n, title, sub, children, tone = "linen" }) => (
  <section id={id} className={`${tone === "linen" ? "bg-linen text-chocolate" : tone === "paper" ? "bg-paper text-chocolate" : "bg-ink text-linen"} px-5 md:px-10 py-12 md:py-16 border-b border-chocolate/20`}>
    <div className="flex items-baseline gap-4 mb-8">
      <span className="font-mono text-xs text-tangelo">{n}</span>
      <div><h2 className="font-display uppercase text-3xl md:text-4xl leading-none">{title}</h2>{sub && <p className="font-serifit italic text-lg mt-2 opacity-80 max-w-2xl">{sub}</p>}</div>
    </div>
    {children}
  </section>
);

export const Expand = ({ title, children, testid, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-chocolate/25">
      <button data-testid={testid} onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2.5 kicker text-chocolate/80 hover:text-tangelo">{title}<ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} /></button>
      {open && <div className="pb-4 animate-rise">{children}</div>}
    </div>
  );
};

export const Loading = ({ error, retry }) => (
  <div className="bg-linen text-chocolate px-5 md:px-10 py-20" data-testid="strategy-loading">
    {error ? <div className="font-mono text-sm"><p className="text-tangelo mb-3">{error}</p><button onClick={retry} className="underline-grow">Retry</button></div>
      : <p className="font-mono text-xs inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading the strategy workspace</p>}
  </div>
);

export const SaveBar = ({ dirty, busy, onSave, testid = "save-bar" }) => (
  <div className={`sticky bottom-0 z-30 transition-transform duration-300 ${dirty ? "translate-y-0" : "translate-y-full pointer-events-none"}`} data-testid={testid}>
    <div className="bg-chocolate text-linen px-5 md:px-10 py-3 flex items-center justify-between gap-4 border-t-2 border-tangelo">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Unsaved changes</span>
      <button data-testid={`${testid}-btn`} onClick={onSave} disabled={busy} className="bg-tangelo text-linen font-mono text-[11px] uppercase tracking-[0.16em] px-5 py-2 hover:bg-linen hover:text-chocolate transition-colors disabled:opacity-50">{busy ? "Saving" : "Save"}</button>
    </div>
  </div>
);

export function CopyDraftBtn({ id, testid = "make-copy" }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try { const c = await copyDraft(id); toast.success("Your own copy is ready. The original is unchanged."); nav(`/content?draft=${c.id}`); }
    catch { toast.error("Couldn't create a copy."); } finally { setBusy(false); }
  };
  return <button data-testid={testid} onClick={go} disabled={busy} className="font-mono text-[10px] uppercase tracking-[0.14em] border-2 border-chocolate px-3 py-2 hover:bg-chocolate hover:text-linen transition-colors disabled:opacity-50">{busy ? "Copying" : "Create your own version"}</button>;
}

export const T = ({ edit, value, onChange, rows = 2, className = "", readClass = "", placeholder = "", testid, empty = "" }) =>
  edit ? <textarea data-testid={testid} rows={rows} className={`field ${className}`} placeholder={placeholder} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    : <p data-testid={testid ? `${testid}-text` : undefined} className={`whitespace-pre-line ${readClass}`}>{value || <span className="opacity-40">{empty}</span>}</p>;

export function EditBar({ owner, editing, dirty, busy, onEdit, onSave, onCancel, label = "Edit", testid = "doc" }) {
  if (!owner) return null;
  const cancel = () => { if (!dirty || window.confirm("Discard your unsaved changes?")) onCancel(); };
  return (
    <div className="sticky top-[6.25rem] z-30 flex justify-end px-5 md:px-10 -mb-12 pointer-events-none" data-testid={`${testid}-editbar`}>
      <div className="pointer-events-auto flex gap-2 mt-3">
        {!editing ? <button data-testid={`${testid}-edit`} onClick={onEdit} className="font-mono text-[10px] uppercase tracking-[0.14em] bg-chocolate text-linen px-4 py-2 hover:bg-tangelo transition-colors">{label}</button> : <>
          <button data-testid={`${testid}-cancel`} onClick={cancel} className="font-mono text-[10px] uppercase tracking-[0.14em] bg-linen text-chocolate border-2 border-chocolate px-4 py-2 hover:bg-paper">Cancel</button>
          <button data-testid={`${testid}-save`} onClick={onSave} disabled={busy || !dirty} className="font-mono text-[10px] uppercase tracking-[0.14em] bg-tangelo text-linen px-4 py-2 hover:bg-chocolate transition-colors disabled:opacity-50">{busy ? "Saving" : dirty ? "Save" : "No changes"}</button>
        </>}
      </div>
    </div>
  );
}
