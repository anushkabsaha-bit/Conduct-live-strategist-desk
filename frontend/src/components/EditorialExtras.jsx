import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { http, update, recordDecision } from "../lib/api";
import { Btn, Tag } from "./kit";

export function DraftFlags({ draft, text }) {
  if (!draft.flags?.length) return null;
  return (
    <div className="border-2 border-chocolate bg-paper p-4" data-testid="draft-flags">
      <p className="kicker text-tangelo mb-3">Before publication: what's verified, what's illustrative</p>
      <div className="grid md:grid-cols-3 gap-3">
        {draft.flags.map((f, i) => {
          const present = text.includes(f.line);
          return (
            <div key={i} data-testid={`draft-flag-${i}`} className={`p-3 border ${f.label === "illustrative" && present ? "border-tangelo bg-tangelo/10" : "border-chocolate/25"}`}>
              <div className="flex gap-2 mb-1.5"><Tag tone={f.label === "verified" ? "green" : f.label === "illustrative" ? "solid" : "blue"}>{f.label}</Tag>{!present && <Tag tone="green">removed or changed</Tag>}</div>
              <p className="font-mono text-[11px] italic mb-1">"{f.line}"</p>
              <p className="font-mono text-[11px] opacity-75">{f.note}</p>
            </div>
          );
        })}
      </div>
      <p className="font-mono text-[10px] opacity-60 mt-2">Edit the text in the editor below and save a new version. Flags update against the editor text.</p>
    </div>
  );
}

const OPTS = [["original", "Keep the original"], ["alternative", "Use the alternative"], ["own", "My own version"]];

export function OpeningChoice({ draft, cur, reload }) {
  const o = draft.opening_alternatives;
  const [c, setC] = useState(o?.choice || "");
  const [own, setOwn] = useState(o?.own_text || o?.alternative || "");
  const [why, setWhy] = useState(o?.reason || "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setC(o?.choice || ""); setWhy(o?.reason || ""); }, [draft.id]); // eslint-disable-line
  if (!o) return null;
  const save = async () => {
    if (!c || !why.trim()) return toast.error("Choose an opening and say why.");
    setBusy(true);
    try {
      const chosen = c === "original" ? o.original : c === "alternative" ? o.alternative : own;
      const from = [o.original, o.alternative, o.own_text].find((x) => x && cur.text.includes(x));
      let versioned = false;
      if (from && from !== chosen) {
        await http.post(`/drafts/${draft.id}/versions`, { text: cur.text.replace(from, chosen), note: `Opening: ${OPTS.find((x) => x[0] === c)[1].toLowerCase()}`, source: "user" });
        versioned = true;
      }
      await update("drafts", draft.id, { opening_alternatives: { ...o, choice: c, reason: why, own_text: c === "own" ? own : o.own_text || "", decided_at: new Date().toISOString() } });
      await recordDecision({ ref_type: "draft", ref_id: draft.id, label: `${draft.title} · opening`, choice: `Opening: ${OPTS.find((x) => x[0] === c)[1]}`, note: why });
      toast.success(versioned ? "Opening saved as a new version. v1 is untouched." : from ? "Choice recorded. The text already uses this opening." : "Choice recorded. The current text no longer contains either opening, so nothing was replaced.");
      reload();
    } catch { toast.error("Couldn't save. Nothing was changed."); } finally { setBusy(false); }
  };
  return (
    <div className="border-2 border-chocolate" data-testid="opening-choice">
      <div className="bg-chocolate text-linen px-5 py-3"><p className="font-display uppercase text-xl">The opening: original or alternative?</p></div>
      <div className="grid md:grid-cols-2">
        {[["original", "Original", o.original], ["alternative", "Proposed alternative", o.alternative]].map(([k, t, x]) => (
          <div key={k} className={`p-5 ${k === "original" ? "md:border-r-2 border-b-2 md:border-b-0 border-chocolate" : ""} ${c === k ? "bg-paper" : "bg-linen"}`} data-testid={`opening-${k}`}>
            <p className="kicker text-tangelo mb-2">{t}</p><p className="font-serifit text-lg leading-snug whitespace-pre-line">{x}</p>
          </div>
        ))}
      </div>
      <div className="p-5 border-t-2 border-chocolate bg-linen space-y-3">
        <p className="font-mono text-xs leading-relaxed max-w-3xl">{o.difference}</p>
        <div className="flex flex-wrap gap-2">{OPTS.map(([k, l]) => <button key={k} data-testid={`opening-pick-${k}`} onClick={() => setC(k)} className={`px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] border-2 border-chocolate transition-colors ${c === k ? "bg-chocolate text-linen" : "hover:bg-paper"}`}>{l}</button>)}</div>
        {c === "own" && <textarea data-testid="opening-own" className="field min-h-[90px] !font-serifit !text-lg" value={own} onChange={(e) => setOwn(e.target.value)} />}
        <textarea data-testid="opening-reason" className="field min-h-[60px]" placeholder="Does the extra detail help this audience, or delay the point?" value={why} onChange={(e) => setWhy(e.target.value)} />
        <Btn data-testid="opening-save" onClick={save} loading={busy}>Save my choice</Btn>
        {o.decided_at && <p className="font-mono text-[10px] opacity-70" data-testid="opening-saved">Saved: {OPTS.find((x) => x[0] === o.choice)?.[1]}. {o.reason}</p>}
      </div>
    </div>
  );
}
