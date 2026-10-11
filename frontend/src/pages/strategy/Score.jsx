import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Copy, Download, RotateCcw, Loader2 } from "lucide-react";
import { useStrategy, computeScore, scoreEvent } from "../../lib/strategy";

function Intro({ cfg, onStart }) {
  return (
    <div className="max-w-3xl animate-rise" data-testid="score-intro">
      <p className="kicker text-botticelli mb-6">Independent campaign prototype</p>
      <h1 className="font-display uppercase leading-[0.88] text-6xl sm:text-7xl lg:text-8xl">What's your <span className="text-tangelo">SAP Score?</span></h1>
      <p className="font-serifit italic text-2xl text-linen/80 mt-6 max-w-xl">{cfg.intro}</p>
      <button data-testid="score-start" onClick={onStart} className="mt-10 inline-flex items-center gap-3 bg-tangelo text-linen font-mono text-xs tracking-[0.18em] uppercase px-7 py-4 hover:bg-linen hover:text-chocolate transition-colors">Start <ArrowRight className="w-4 h-4" /></button>
      <p className="font-mono text-[10px] text-linen/45 mt-8 max-w-xl leading-relaxed" data-testid="score-disclaimer">{cfg.disclaimer}</p>
    </div>
  );
}

function Question({ q, i, n, picked, onPick, onBack }) {
  return (
    <div className="max-w-3xl w-full animate-rise" key={q.id} data-testid={`score-question-${i + 1}`}>
      <div className="flex items-center gap-3 mb-8">
        {Array.from({ length: n }).map((_, k) => <span key={k} className={`h-1 flex-1 transition-colors duration-300 ${k <= i ? "bg-tangelo" : "bg-linen/15"}`} />)}
        <span className="font-mono text-[10px] text-linen/50 ml-2">{i + 1}/{n}</span>
      </div>
      <h2 className="font-serifit text-3xl md:text-5xl leading-[1.05] mb-10">{q.q}</h2>
      <div className="grid gap-2.5">
        {q.options.map((o, k) => (
          <button key={k} data-testid={`score-option-${i + 1}-${k}`} onClick={() => onPick(k)}
            className={`group text-left flex items-center gap-4 px-5 py-4 border transition-[background-color,border-color,transform] duration-200 hover:translate-x-1 ${picked === k ? "bg-linen text-chocolate border-linen" : "border-linen/25 hover:border-tangelo"}`}>
            <span className={`font-mono text-[11px] w-6 ${picked === k ? "text-tangelo" : "text-linen/40 group-hover:text-tangelo"}`}>{String.fromCharCode(65 + k)}</span>
            <span className="font-mono text-sm md:text-base">{o.label}</span>
          </button>
        ))}
      </div>
      {i > 0 && <button data-testid="score-back" onClick={onBack} className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-linen/50 hover:text-linen inline-flex items-center gap-2"><ArrowLeft className="w-3 h-3" />Previous question</button>}
    </div>
  );
}

function Result({ score, result, onRestart }) {
  const card = useRef(null);
  const [busy, setBusy] = useState("");
  const png = () => toPng(card.current, { pixelRatio: 2, cacheBust: true });
  const download = async () => {
    setBusy("dl");
    try { const url = await png(); const a = document.createElement("a"); a.href = url; a.download = `sap-score-${score}.png`; a.click(); scoreEvent("download", result.title); toast.success("Result card downloaded"); }
    catch { toast.error("Download isn't supported in this browser."); } finally { setBusy(""); }
  };
  const copy = async () => {
    setBusy("cp");
    try {
      if (window.ClipboardItem && navigator.clipboard?.write) {
        const blob = await (await fetch(await png())).blob();
        await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
        toast.success("Result card copied as an image");
      } else {
        await navigator.clipboard.writeText(`My SAP Score: ${score}. "${result.title}". ${result.prompt}`);
        toast.success("Result copied as text");
      }
      scoreEvent("copy", result.title);
    } catch {
      try { await navigator.clipboard.writeText(`My SAP Score: ${score}. "${result.title}". ${result.prompt}`); scoreEvent("copy", result.title); toast.success("Result copied as text"); }
      catch { toast.error("Copy isn't available here. Try download instead."); }
    } finally { setBusy(""); }
  };
  return (
    <div className="grid lg:grid-cols-[auto_1fr] gap-10 lg:gap-16 items-center w-full max-w-5xl mx-auto animate-rise" data-testid="score-result">
      <div ref={card} className="bg-[#FFFDF6] text-chocolate p-4 pb-6 w-[320px] sm:w-[360px] -rotate-2 spotlight" data-testid="score-card">
        <div className="bg-ink text-linen aspect-square flex flex-col justify-between p-6 relative overflow-hidden">
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-botticelli">SAP Score</span>
          <span className="font-display leading-none text-[150px] sm:text-[170px] text-tangelo" data-testid="score-value">{score}<span className="text-5xl text-linen">%</span></span>
          <span className="absolute -right-6 -bottom-6 w-28 h-28 border-[10px] border-botticelli/40 rounded-full" aria-hidden="true" />
        </div>
        <p className="font-hand text-[32px] leading-[0.95] mt-4" data-testid="score-title">{result.title}</p>
        <p className="font-mono text-[10px] mt-3 opacity-60">conduct/ campaign prototype · not a real assessment</p>
      </div>
      <div>
        <p className="kicker text-botticelli mb-3">Your result</p>
        <p className="font-serifit text-3xl md:text-4xl leading-tight">{result.line}</p>
        <p className="font-mono text-sm text-linen/70 mt-6 border-l-2 border-tangelo pl-4">Worth asking your team: {result.prompt}</p>
        <div className="flex flex-wrap gap-2 mt-8">
          <button data-testid="score-copy" onClick={copy} disabled={!!busy} className="inline-flex items-center gap-2 bg-linen text-chocolate font-mono text-[11px] tracking-[0.16em] uppercase px-5 py-3 hover:bg-tangelo hover:text-linen transition-colors disabled:opacity-50">{busy === "cp" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}Copy card</button>
          <button data-testid="score-download" onClick={download} disabled={!!busy} className="inline-flex items-center gap-2 border border-linen/50 font-mono text-[11px] tracking-[0.16em] uppercase px-5 py-3 hover:bg-linen hover:text-chocolate transition-colors disabled:opacity-50">{busy === "dl" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Download PNG</button>
          <button data-testid="score-restart" onClick={onRestart} className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] uppercase px-5 py-3 text-linen/70 hover:text-tangelo transition-colors"><RotateCcw className="w-3.5 h-3.5" />Play again</button>
        </div>
        <p className="font-mono text-[10px] text-linen/40 mt-8 max-w-md">This score comes only from your three answers. It says nothing about any real SAP system.</p>
      </div>
    </div>
  );
}

export default function ScorePage() {
  const { docs, error, reload } = useStrategy();
  const [step, setStep] = useState(-1);
  const [picks, setPicks] = useState([]);
  const cfg = docs?.score_config;
  const n = cfg?.questions.length || 0;
  const start = () => { setPicks([]); setStep(0); scoreEvent("start"); };
  const pick = (k) => {
    const p = [...picks]; p[step] = k; setPicks(p);
    setTimeout(() => {
      if (step + 1 < n) setStep(step + 1);
      else { setStep(n); scoreEvent("complete", computeScore(cfg, p).result.title); }
    }, 280);
  };
  const restart = () => { scoreEvent("restart"); setPicks([]); setStep(-1); };
  const res = cfg && step === n ? computeScore(cfg, picks) : null;
  return (
    <div className="min-h-screen bg-ink text-linen flex flex-col" data-testid="score-page">
      <div className="grain" aria-hidden="true" />
      <header className="flex items-center justify-between px-5 md:px-10 h-14 border-b border-linen/10">
        <Link to="/strategy" data-testid="score-back-to-workspace" className="font-mono text-[10px] tracking-[0.16em] uppercase text-linen/60 hover:text-tangelo inline-flex items-center gap-2"><ArrowLeft className="w-3.5 h-3.5" />Strategy workspace</Link>
        <span className="font-display uppercase text-xl">conduct<span className="text-tangelo">/</span> <span className="font-mono text-[9px] tracking-[0.18em] text-linen/45 align-middle">prototype</span></span>
        <Link to="/strategy/measure" data-testid="score-to-measure" className="font-mono text-[10px] tracking-[0.16em] uppercase text-linen/60 hover:text-tangelo hidden sm:inline-flex items-center gap-2">How it's judged<ArrowRight className="w-3.5 h-3.5" /></Link>
      </header>
      <main className="flex-1 flex items-center px-5 md:px-10 py-12">
        {!cfg ? <p className="font-mono text-xs" data-testid="score-loading">{error ? <button onClick={reload} className="text-tangelo underline">{error} Retry</button> : <span className="inline-flex gap-2 items-center"><Loader2 className="w-4 h-4 animate-spin" />Loading</span>}</p>
          : step < 0 ? <Intro cfg={cfg} onStart={start} />
          : step < n ? <Question q={cfg.questions[step]} i={step} n={n} picked={picks[step]} onPick={pick} onBack={() => setStep(step - 1)} />
          : <Result score={res.score} result={res.result} onRestart={restart} />}
      </main>
    </div>
  );
}
