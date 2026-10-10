import React, { createContext, useContext, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { http } from "../lib/api";
import { human } from "../lib/meta";

const PostsCtx = createContext({ posts: [], summary: null });
export const usePosts = () => useContext(PostsCtx);

export function PostsProvider({ children }) {
  const [state, set] = useState({ posts: [], summary: null });
  useEffect(() => { http.get("/dataset/posts").then((r) => set(r.data)).catch(() => {}); }, []);
  return <PostsCtx.Provider value={state}>{children}</PostsCtx.Provider>;
}

export function PostChip({ id }) {
  const { posts } = usePosts();
  const p = posts.find((x) => x.id === id);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button data-testid={`post-chip-${id}`} className="inline-block align-baseline mx-0.5 px-1.5 font-mono text-[10px] tracking-[0.1em] bg-[#2F7D4F] text-linen hover:bg-tangelo transition-colors">{id}</button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-paper border-2 border-chocolate text-chocolate p-4 rounded-none">
        {p ? (
          <div data-testid={`post-evidence-${id}`}>
            <p className="kicker text-tangelo mb-1">{p.id} · {p.month} · dataset row</p>
            <p className="font-mono text-xs leading-relaxed mb-3">{p.description}</p>
            <div className="grid grid-cols-3 border-t border-chocolate/30 pt-2 text-center">
              {["likes", "comments", "reposts"].map((k) => (
                <div key={k}><p className="font-display text-2xl text-tangelo">{p[k] ?? ", "}</p><p className="kicker text-chocolate/60">{k}</p></div>
              ))}
            </div>
            {p.note && <p className="font-mono text-[10px] italic mt-2 text-chocolate/70">{p.note}</p>}
            <p className="font-mono text-[10px] mt-2 text-chocolate/50">Source: {p.source}</p>
          </div>
        ) : <p className="font-mono text-xs">Post {id} is not in the supplied dataset, treat this reference with caution.</p>}
      </PopoverContent>
    </Popover>
  );
}

const LABELS = { VERIFIED: "bg-[#2F7D4F] text-linen", DATASET: "bg-botticelli text-chocolate", EXTERNAL: "bg-chocolate text-linen", HYPOTHESIS: "border border-tangelo text-tangelo", ILLUSTRATIVE: "border border-chocolate/50 text-chocolate/80", "NEEDS APPROVAL": "bg-tangelo text-linen", "UNVERIFIED LEAD": "border border-tangelo text-tangelo" };
const RX = /(\[(?:VERIFIED|DATASET|EXTERNAL|HYPOTHESIS|ILLUSTRATIVE|NEEDS APPROVAL)\]|UNVERIFIED LEAD|\bP[0-3]\d\b)/g;

export function Claim({ text }) {
  if (typeof text !== "string") return <>{String(text)}</>;
  return text.split(RX).map((part, i) => {
    if (/^P[0-3]\d$/.test(part)) return <PostChip key={i} id={part} />;
    const lab = part.replace(/[[\]]/g, "");
    if (LABELS[lab]) return <span key={i} className={`inline-block mx-0.5 px-1 font-mono text-[9px] tracking-[0.14em] uppercase align-middle ${LABELS[lab]}`}>{lab}</span>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const inline = (t, k) => t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith("**") && p.endsWith("**") ? <strong key={`${k}-${i}`}><Claim text={p.slice(2, -2)} /></strong> : <Claim key={`${k}-${i}`} text={p} />);

export function Markdown({ text }) {
  return (
    <div className="space-y-2">
      {text.split("\n").map((l, i) => {
        const t = l.trim();
        if (!t) return null;
        if (/^-{3,}$/.test(t)) return <hr key={i} className="border-chocolate/20" />;
        const h = t.match(/^#{1,4}\s+(.*)/);
        if (h) return <p key={i} className="font-display uppercase text-lg leading-tight pt-2 text-tangelo">{h[1].replace(/\*\*/g, "")}</p>;
        const b = t.match(/^(?:[-*•]|\d+[.)])\s+(.*)/);
        if (b) return <p key={i} className="pl-4 relative"><span className="absolute left-0 text-tangelo">·</span>{inline(b[1], i)}</p>;
        return <p key={i}>{inline(t, i)}</p>;
      })}
    </div>
  );
}

function renderValue(v, dark) {
  if (v == null || v === "") return <span className="opacity-50">, </span>;
  if (Array.isArray(v)) {
    if (!v.length) return <span className="opacity-50">None</span>;
    if (v.every((x) => typeof x !== "object")) {
      if (v.every((x) => /^P[0-3]\d$/.test(x))) return <span>{v.map((x) => <PostChip key={x} id={x} />)}</span>;
      return <ol className="space-y-1.5">{v.map((x, i) => <li key={i} className="flex gap-3"><span className="text-tangelo text-xs pt-0.5">{String(i + 1).padStart(2, "0")}</span><span><Claim text={String(x)} /></span></li>)}</ol>;
    }
    return <div className="space-y-2">{v.map((x, i) => <div key={i} className={`border-l-2 pl-3 py-1 ${dark ? "border-linen/30" : "border-chocolate/30"}`}>{renderObj(x, dark, true)}</div>)}</div>;
  }
  if (typeof v === "object") return renderObj(v, dark, true);
  if (typeof v === "boolean") return <span>{v ? "Yes" : "No"}</span>;
  return <span className="whitespace-pre-wrap"><Claim text={String(v)} /></span>;
}

function renderObj(o, dark, compact) {
  return (
    <div className={compact ? "space-y-1" : "space-y-5"}>
      {Object.entries(o).map(([k, v]) => (
        <div key={k} className={compact ? "grid md:grid-cols-[150px_1fr] gap-x-3" : ""}>
          <p className={`kicker ${compact ? "pt-0.5" : "mb-2"} ${dark ? "text-botticelli" : "text-tangelo"}`}>{human(k)}</p>
          <div className="font-mono text-xs md:text-sm leading-relaxed">{renderValue(v, dark)}</div>
        </div>
      ))}
    </div>
  );
}

export function Output({ data, dark, omit = [] }) {
  if (!data) return null;
  const o = Object.fromEntries(Object.entries(data).filter(([k]) => !omit.includes(k)));
  return renderObj(o, dark, false);
}
