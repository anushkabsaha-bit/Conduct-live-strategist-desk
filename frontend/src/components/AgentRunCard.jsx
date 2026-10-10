import React, { useState } from "react";
import { Play, RotateCcw, History } from "lucide-react";
import { AgentChip, Btn, Note } from "./kit";
import { Output } from "./Output";
import { useRuns } from "./useRuns";
import { AGENTS, fmtDate } from "../lib/meta";

export default function AgentRunCard(props) {
  const hook = useRuns(props.task, props.refType, props.refId);
  return <RunView {...props} hook={hook} />;
}

export function RunView({ agent, task, label, getInput, render, dark, hint, testid, onDone, version, hook }) {
  const { runs, running, error, run } = hook;
  const [idx, setIdx] = useState(0);
  const shown = runs[idx];
  const go = async () => { const r = await run(getInput ? getInput() : undefined); setIdx(0); if (r && onDone) onDone(r); };
  const stale = version && shown?.snapshot?.version && shown.snapshot.version !== version;
  const tid = testid || task.replace(".", "-");
  return (
    <div data-testid={`run-card-${tid}`} className={`${dark ? "bg-chocolate text-linen" : "bg-paper text-chocolate border-2 border-chocolate"} p-5 md:p-6`} style={{ borderTop: `6px solid ${AGENTS[agent].color}` }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <AgentChip id={agent} />
          <p className="font-display uppercase text-xl leading-none">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          {runs.length > 1 && (
            <select data-testid={`run-history-${tid}`} value={idx} onChange={(e) => setIdx(+e.target.value)} className={`${dark ? "field-dark" : "field"} !w-auto !py-1 !text-[11px]`}>
              {runs.map((r, i) => <option key={r.id} value={i}>{`${i === 0 ? "Latest" : "Earlier"} · ${fmtDate(r.created_at)}`}</option>)}
            </select>
          )}
          <Btn data-testid={`run-btn-${tid}`} variant={dark ? "lineDark" : "dark"} onClick={go} loading={running}>
            {runs.length ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}{running ? "Working" : runs.length ? "Run again" : "Run"}
          </Btn>
        </div>
      </div>
      {running && <p data-testid={`run-working-${tid}`} className="font-hand text-xl mb-3 animate-pulse">{AGENTS[agent].name} is working on it… this usually takes 30–90 seconds.</p>}
      {error && !running && <p data-testid={`run-error-${tid}`} className="font-mono text-xs bg-tangelo text-linen px-3 py-2 mb-3">Failed: {error}. Nothing was saved — press Run again to retry.</p>}
      {shown ? (
        <div data-testid={`run-output-${tid}`}>
          <p className={`flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] uppercase mb-4 ${dark ? "text-linen/60" : "text-chocolate/60"}`}>
            <History className="w-3 h-3" /> Completed analysis · {AGENTS[agent].name} · {fmtDate(shown.created_at)}{shown.snapshot?.version ? ` · on v${shown.snapshot.version}` : ""}
            {stale && <span className="text-tangelo">· draft has changed since — re-run</span>}
          </p>
          {render ? render(shown.output, shown) : <Output data={shown.output} dark={dark} />}
        </div>
      ) : !running && <Note>{hint || "Not run yet. Nothing here is a completed analysis until you press Run."}</Note>}
    </div>
  );
}
