import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { list } from "../../lib/api";
import { StrategyTabs, LabelChip } from "../../components/StrategyKit";

const FLAG = { illustrative: "illustrative", verified: "verified", interpretation: "interpretation" };
const STATUS = { draft: "Unapproved draft", in_review: "In review", approved: "Approved by me, not by Conduct", rejected: "Rejected", published_manually: "Published manually" };
const cur = (d) => d.versions[d.versions.length - 1];

function Piece({ d, n, children }) {
  return (
    <article className="grid lg:grid-cols-[200px_1fr_280px] gap-6 lg:gap-10 px-5 md:px-10 py-10 border-b border-chocolate/20 animate-rise" data-testid={`writing-piece-${n}`}>
      <div><p className="font-mono text-xs text-tangelo">{String(n).padStart(2, "0")}</p><p className="kicker mt-2 opacity-60">{d.format} · v{cur(d).n}</p><p className="font-mono text-[9px] tracking-[0.14em] uppercase bg-tangelo text-linen inline-block px-1.5 py-0.5 mt-2">{STATUS[d.status] || d.status}</p></div>
      <div className="min-w-0">
        <h2 className="font-display uppercase text-2xl md:text-3xl leading-none mb-5">{d.title}</h2>
        <p className="font-serifit text-lg md:text-xl leading-snug whitespace-pre-line max-w-2xl" data-testid={`writing-text-${n}`}>{cur(d).text}</p>
      </div>
      <aside className="space-y-4">{children}
        <Link to={`/content?draft=${d.id}`} data-testid={`writing-open-${n}`} className="font-mono text-[10px] uppercase tracking-[0.14em] underline-grow inline-flex items-center gap-1">See the editing in Content Desk<ArrowRight className="w-3 h-3" /></Link>
      </aside>
    </article>
  );
}

function Opening({ o }) {
  return (
    <div className="px-5 md:px-10 py-10 bg-paper border-b border-chocolate/20" data-testid="writing-opening-edit">
      <p className="kicker text-tangelo mb-4">One edit, side by side · the Freudenberg draft opening</p>
      <div className="grid md:grid-cols-2 gap-0 border-2 border-chocolate">
        {[["Original", o.original, "original"], ["Proposed alternative", o.alternative, "alternative"]].map(([t, x, k]) => (
          <div key={k} className={`p-5 md:p-6 ${k === "original" ? "md:border-r-2 border-b-2 md:border-b-0 border-chocolate" : ""} ${o.choice === k ? "bg-linen" : ""}`}>
            <p className="kicker mb-3">{t}{o.choice === k && <span className="text-tangelo"> · my choice</span>}</p>
            <p className="font-serifit text-lg leading-snug whitespace-pre-line">{x}</p>
          </div>
        ))}
      </div>
      <p className="font-mono text-xs leading-relaxed mt-4 max-w-3xl">{o.difference}</p>
      <p className="font-mono text-xs mt-3 max-w-3xl" data-testid="writing-opening-choice">{o.choice ? <>I chose <b>{o.choice === "own" ? "my own edit" : o.choice}</b>: {o.reason}</> : <span className="opacity-60">Not decided yet. The choice is made in Content Desk.</span>}</p>
    </div>
  );
}

export default function Writing() {
  const [drafts, setDrafts] = useState(null);
  const [err, setErr] = useState("");
  const load = () => list("drafts").then(setDrafts).catch(() => setErr("Couldn't load the drafts."));
  useEffect(() => { load(); }, []);
  const three = drafts?.find((d) => d.series === "editorial_case");
  const freud = drafts?.find((d) => d.opening_alternatives);
  const launch = (drafts || []).filter((d) => d.series === "launch_narrative");
  return (
    <div data-testid="writing-page">
      <StrategyTabs />
      <div className="bg-linen text-chocolate">
        <header className="px-5 md:px-10 pt-12 pb-8 border-b-2 border-chocolate">
          <p className="kicker text-tangelo mb-3">01 · The writing</p>
          <h1 className="font-display uppercase leading-[0.92] text-4xl sm:text-5xl lg:text-6xl">Finding the human bit <span className="text-tangelo">in a technical idea</span></h1>
          <p className="font-mono text-xs mt-4 max-w-2xl opacity-80">Proposed, unapproved LinkedIn drafts based on Conduct's public material. Each one is shown as it currently stands, with what still needs checking.</p>
        </header>
        {!drafts ? <p className="px-5 md:px-10 py-16 font-mono text-xs">{err ? <button onClick={load} className="text-tangelo underline">{err} Retry</button> : "Loading drafts"}</p> : (<>
          {three && <Piece d={three} n={1}>
            {(three.flags || []).map((f, i) => { const present = cur(three).text.includes(f.line); return (
              <div key={i} data-testid={`writing-flag-${i}`}><p className="font-mono text-[11px] bg-paper px-2 py-1 mb-1">"{f.line}"</p><div className="flex gap-2 items-center"><LabelChip label={FLAG[f.label] || "interpretation"} />{!present && <span className="font-mono text-[9px] uppercase text-[#2F7D4F]">Removed or changed</span>}</div><p className="font-mono text-[11px] opacity-75 mt-1">{f.note}</p></div>); })}
          </Piece>}
          {freud && <Opening o={freud.opening_alternatives} />}
          {launch.map((d, i) => <Piece key={d.id} d={d} n={i + 2}><p className="font-mono text-[11px] leading-relaxed opacity-75">One of three launch directions. The line-by-line evidence and my comparison live in the narrative.</p><Link to="/strategy/narrative#drafts" className="font-mono text-[10px] uppercase tracking-[0.14em] text-tangelo underline-grow block">Evidence and comparison</Link></Piece>)}
        </>)}
      </div>
    </div>
  );
}
